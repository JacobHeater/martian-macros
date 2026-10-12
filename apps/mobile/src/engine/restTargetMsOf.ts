import type { Workout } from '../domain/training/Workout';

/**
 * The rest the user means to take now, in milliseconds (MM-191): the target
 * of the exercise whose set ended most recently in `workout`. Undefined when
 * no set has ended or that exercise has no target.
 */
export function restTargetMsOf(workout: Workout): number | undefined {
  let latest: Date | undefined;
  let target: number | undefined;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      const end = set.endedAt;
      if (end !== undefined && (latest === undefined || end.getTime() > latest.getTime())) {
        latest = end;
        target = exercise.restTargetMs;
      }
    }
  }
  return target;
}
