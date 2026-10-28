import type { HealthWorkoutReader } from '../domain/integration/HealthWorkoutReader';
import type { HealthWorkoutWriter } from '../domain/integration/HealthWorkoutWriter';
import { CardioActivity } from '../domain/training/CardioActivity';
import type { PlatformWorkout } from '../domain/training/PlatformWorkout';
import type { PlatformWorkoutSegment } from '../domain/training/PlatformWorkoutSegment';
import type { WorkoutForPlatform } from '../domain/training/WorkoutForPlatform';
import { HealthReadFailure } from '../healthIngest/HealthReadFailure';
import { compareStrings } from '../lang/compareStrings';
import type { MmHealthApi } from './MmHealthApi';
import type { MmHealthWorkout } from './MmHealthWorkout';
import type { MmHealthWorkoutsApi } from './MmHealthWorkoutsApi';
import type { MmHealthWritingApi } from './MmHealthWritingApi';

/**
 * A workout read from the plugin, its segments inside it and oldest first; undefined for one with no span, and for
 * one the app wrote itself, as the platform says by its source, not by the client id alone (MM-489, MM-490).
 */
function platformWorkout(raw: MmHealthWorkout): PlatformWorkout | undefined {
  if (raw.ours === true) return undefined;
  if (raw.id === '' || raw.endMs < raw.startMs) return undefined;
  const segments: PlatformWorkoutSegment[] = raw.segments
    .filter((s) => s.endMs > s.startMs && s.startMs >= raw.startMs && s.endMs <= raw.endMs)
    .map((s) => ({
      segmentId: s.segmentId,
      start: new Date(s.startMs),
      end: new Date(s.endMs),
      repetitions: s.repetitions === undefined || s.repetitions < 0 ? undefined : s.repetitions,
      // Only an alpha of the client library carries a weight (MM-188).
      weightKg: undefined,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  return {
    platformId: raw.id,
    clientId: raw.clientId === '' ? undefined : raw.clientId,
    strength: raw.strength,
    // A non-strength session's activity (MM-677); a strength session has none, and an older plugin says none.
    cardio: raw.strength ? undefined : CardioActivity.named(raw.activity),
    start: new Date(raw.startMs),
    end: new Date(raw.endMs),
    segments,
    sourceId: raw.sourceId,
    sourceName: raw.sourceName,
  };
}

/**
 * Workouts on Health Connect or Apple Health (MM-489), over the app's own
 * plugin. Reading needs workouts allowed for reading (MM-68); writing is
 * "workouts" turned on, which asks for the write permission alone. A
 * workout is written as a strength session under the app's own id, so
 * writing it again replaces it; with its segments where the platform names
 * exercises (Health Connect), as the session alone where it does not. A
 * workout deleted in the app is removed by that id (MM-515).
 */
export class NativeHealthWorkouts implements HealthWorkoutReader, HealthWorkoutWriter {
  readonly namesExercises: boolean;
  private readonly api: Pick<MmHealthApi, 'status' | 'permitted'> & MmHealthWorkoutsApi & MmHealthWritingApi;

  constructor({
    api,
    namesExercises,
  }: {
    api: Pick<MmHealthApi, 'status' | 'permitted'> & MmHealthWorkoutsApi & MmHealthWritingApi;
    namesExercises: boolean;
  }) {
    this.api = api;
    this.namesExercises = namesExercises;
  }

  private async readPermitted(): Promise<boolean> {
    const { status } = await this.api.status();
    if (status !== 'available') return false;
    const { types } = await this.api.permitted({ types: ['workout'] });
    return types.includes('workout');
  }

  async readWorkouts({ from, to }: { from: Date; to: Date }): Promise<PlatformWorkout[]> {
    if (to.getTime() <= from.getTime()) return [];
    let raw: MmHealthWorkout[];
    try {
      if (!(await this.readPermitted())) return [];
      raw = (await this.api.readWorkouts({ fromMs: from.getTime(), toMs: to.getTime() })).workouts;
    } catch {
      throw new HealthReadFailure('reading workouts');
    }
    return raw
      .map(platformWorkout)
      .filter(
        (w): w is PlatformWorkout =>
          w !== undefined && w.start.getTime() >= from.getTime() && w.start.getTime() < to.getTime(),
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime() || compareStrings(a.platformId, b.platformId));
  }

  async writePermitted(): Promise<boolean> {
    try {
      return (await this.api.writing({ kinds: ['workouts'] })).kinds.includes('workouts');
    } catch {
      return false;
    }
  }

  async requestWritePermission(): Promise<boolean> {
    try {
      await this.api.startWriting({ kind: 'workouts' });
    } catch {
      // Not asked, or not answered: what is permitted is what the plugin says next.
    }
    return this.writePermitted();
  }

  async writeWorkout(workout: WorkoutForPlatform): Promise<boolean> {
    if (workout.end.getTime() <= workout.start.getTime() || !(await this.writePermitted())) return false;
    const segments = this.namesExercises
      ? workout.segments.map((s) => ({
          segmentId: s.segmentId,
          startMs: s.start.getTime(),
          endMs: s.end.getTime(),
          ...(s.repetitions === undefined ? {} : { repetitions: s.repetitions }),
        }))
      : [];
    try {
      const { written } = await this.api.writeWorkout({
        clientId: workout.clientId,
        startMs: workout.start.getTime(),
        endMs: workout.end.getTime(),
        segments,
      });
      return written;
    } catch {
      return false;
    }
  }

  async removeWorkout(clientId: string): Promise<boolean> {
    if (!(await this.writePermitted())) return false;
    try {
      return (await this.api.removeWorkout({ clientId })).removed;
    } catch {
      return false;
    }
  }
}
