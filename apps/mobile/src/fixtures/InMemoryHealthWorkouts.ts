import type { HealthWorkoutReader } from '../domain/integration/HealthWorkoutReader';
import type { HealthWorkoutWriter } from '../domain/integration/HealthWorkoutWriter';
import type { PlatformWorkout } from '../domain/training/PlatformWorkout';
import type { WorkoutForPlatform } from '../domain/training/WorkoutForPlatform';
import { compareStrings } from '../lang/compareStrings';

/**
 * A health platform's workouts held in memory (MM-189), standing in for
 * Health Connect (`namesExercises`) or HealthKit (not). Reading and writing
 * are permitted separately, as on a phone; writing is off until asked for.
 * What the app writes is held as the platform would hand it back: a
 * strength session from this app, with its segments only where the
 * platform names exercises.
 */
export class InMemoryHealthWorkouts implements HealthWorkoutReader, HealthWorkoutWriter {
  /** The id the platform gives this app as the source of what it writes. */
  static readonly appSourceId = 'com.martianmacros';

  readonly namesExercises: boolean;

  /** Whether the user has let the app read workouts. */
  readPermitted: boolean;

  /** What the user answers when asked to let the app write workouts. */
  willPermitWrite: boolean;

  private writeGranted = false;
  private readonly held = new Map<string, PlatformWorkout>();

  constructor({
    namesExercises,
    held = [],
    readPermitted = true,
    willPermitWrite = true,
  }: {
    namesExercises: boolean;
    held?: readonly PlatformWorkout[];
    readPermitted?: boolean;
    willPermitWrite?: boolean;
  }) {
    this.namesExercises = namesExercises;
    this.readPermitted = readPermitted;
    this.willPermitWrite = willPermitWrite;
    for (const workout of held) this.held.set(workout.platformId, workout);
  }

  /** Every workout the platform holds, whoever wrote it, oldest first. */
  get all(): PlatformWorkout[] {
    return [...this.held.values()].sort(
      (a, b) => a.start.getTime() - b.start.getTime() || compareStrings(a.platformId, b.platformId),
    );
  }

  readWorkouts({ from, to }: { from: Date; to: Date }): Promise<PlatformWorkout[]> {
    if (!this.readPermitted) return Promise.resolve([]);
    return Promise.resolve(
      this.all.filter((workout) => workout.start.getTime() >= from.getTime() && workout.start.getTime() < to.getTime()),
    );
  }

  writePermitted(): Promise<boolean> {
    return Promise.resolve(this.writeGranted);
  }

  requestWritePermission(): Promise<boolean> {
    if (this.willPermitWrite) this.writeGranted = true;
    return this.writePermitted();
  }

  writeWorkout(workout: WorkoutForPlatform): Promise<boolean> {
    if (!this.writeGranted || workout.end.getTime() <= workout.start.getTime()) return Promise.resolve(false);
    const platformId = `written-${workout.clientId}`;
    this.held.set(platformId, {
      platformId,
      clientId: workout.clientId,
      strength: true,
      start: workout.start,
      end: workout.end,
      segments: this.namesExercises ? [...workout.segments] : [],
      sourceId: InMemoryHealthWorkouts.appSourceId,
      sourceName: 'Martian Macros',
    });
    return Promise.resolve(true);
  }
}
