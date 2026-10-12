import type { Workout } from '../domain/training/Workout';

/**
 * When the current rest began (MM-191): the end of the most recently ended
 * set of `workout`. Undefined before any set has an end. The rest is not
 * stored; it is the gap between one set's end and the next one's start.
 */
export function restStartedAt(workout: Workout): Date | undefined {
  let latest: Date | undefined;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      const end = set.endedAt;
      if (end !== undefined && (latest === undefined || end.getTime() > latest.getTime())) latest = end;
    }
  }
  return latest;
}
