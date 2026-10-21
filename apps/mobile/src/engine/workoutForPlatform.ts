import type { Exercise } from '../domain/training/Exercise';
import { HealthConnectSegment } from '../domain/training/HealthConnectSegment';
import type { PlatformWorkoutSegment } from '../domain/training/PlatformWorkoutSegment';
import type { Workout } from '../domain/training/Workout';
import type { WorkoutForPlatform } from '../domain/training/WorkoutForPlatform';
import { workoutClientIdPrefix } from './workoutClientIdPrefix';

/**
 * What a health platform is told about a finished workout (MM-189), or
 * undefined for one that is unsaved, still in progress or has no length.
 *
 * The workout is always a session with its start and end. Where the
 * platform names exercises, each set of an exercise it names becomes a
 * segment with its repetitions, if the set has both its times and they lie
 * inside the workout. Every other set is left out of the segments and stays
 * in the app: an unmapped exercise is never written as the nearest one, and
 * no time is spread or guessed. A set that overlaps one already taken is
 * left out too, since the platform refuses overlapping segments. Weight,
 * set index and RIR are never written (MM-188).
 */
export function workoutForPlatform(
  workout: Workout,
  exerciseOf: (exerciseId: string) => Exercise | undefined,
  { namesExercises }: { namesExercises: boolean },
): WorkoutForPlatform | undefined {
  const start = workout.startedAt;
  const end = workout.endedAt;
  if (workout.id <= 0 || end === undefined || end.getTime() <= start.getTime()) return undefined;
  const segments: PlatformWorkoutSegment[] = [];
  if (namesExercises) {
    const candidates: PlatformWorkoutSegment[] = [];
    for (const done of workout.exercises) {
      const segment = exerciseOf(done.exerciseId)?.healthConnect;
      if (segment === undefined) continue;
      for (const set of done.sets) {
        const from = set.startedAt;
        const to = set.endedAt;
        if (from === undefined || to === undefined) continue;
        if (from.getTime() < start.getTime() || to.getTime() > end.getTime() || to.getTime() <= from.getTime()) continue;
        candidates.push({
          segmentId: HealthConnectSegment.platformId(segment),
          start: from,
          end: to,
          repetitions: set.reps,
          weightKg: undefined,
        });
      }
    }
    candidates.sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());
    let takenUntil = Number.NEGATIVE_INFINITY;
    for (const candidate of candidates) {
      if (candidate.start.getTime() < takenUntil) continue;
      segments.push(candidate);
      takenUntil = candidate.end.getTime();
    }
  }
  return {
    clientId: `${workoutClientIdPrefix}${workout.id}`,
    start,
    end,
    activeMs: workout.activeMs(end),
    segments,
  };
}
