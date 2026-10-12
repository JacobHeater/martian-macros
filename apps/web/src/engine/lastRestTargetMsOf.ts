import type { Workout } from '../domain/training/Workout';

/**
 * The rest target, in milliseconds, the user last had for an exercise
 * (MM-191): from the most recently started of `workouts` that has the
 * exercise, so a target chosen once is there the next time. Undefined when
 * that one had none.
 */
export function lastRestTargetMsOf({
  exerciseId,
  workouts,
}: {
  exerciseId: string;
  workouts: Iterable<Workout>;
}): number | undefined {
  let latest: Workout | undefined;
  for (const workout of workouts) {
    if (!workout.exercises.some((e) => e.exerciseId === exerciseId)) continue;
    if (latest === undefined || workout.startedAt.getTime() > latest.startedAt.getTime()) {
      latest = workout;
    }
  }
  const matching = latest?.exercises.filter((e) => e.exerciseId === exerciseId);
  return matching?.[matching.length - 1]?.restTargetMs;
}
