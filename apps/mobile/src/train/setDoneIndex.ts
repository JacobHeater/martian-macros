import type { Workout } from '../domain/training/Workout';

/**
 * The exercise the timer bar's "Set done" records on (MM-222), by its
 * place, or undefined when the workout has none: the last one when it has
 * no sets yet (just added, so the one being started), otherwise the one
 * with the set that ended last, otherwise the last one.
 */
export function setDoneIndex(workout: Workout): number | undefined {
  const exercises = workout.exercises;
  const last = exercises.length - 1;
  if (last < 0) return undefined;
  if (exercises[last]?.sets.length === 0) return last;
  let latest: number | undefined;
  let latestAt = -Infinity;
  exercises.forEach((exercise, i) => {
    for (const set of exercise.sets) {
      const at = set.endedAt?.getTime();
      if (at !== undefined && at >= latestAt) {
        latestAt = at;
        latest = i;
      }
    }
  });
  return latest ?? last;
}
