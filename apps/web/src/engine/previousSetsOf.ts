import type { Workout } from '../domain/training/Workout';
import type { WorkoutSet } from '../domain/training/WorkoutSet';

/**
 * What was done last time (MM-75): the sets of `exerciseId` in the most
 * recent workout started before `before` that has any. Empty if it has never
 * been logged before then.
 */
export function previousSetsOf({
  exerciseId,
  workouts,
  before,
}: {
  exerciseId: string;
  workouts: Iterable<Workout>;
  before: Date;
}): readonly WorkoutSet[] {
  const earlier = [...workouts]
    .filter((workout) => workout.startedAt.getTime() < before.getTime())
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  for (const workout of earlier) {
    const sets = workout.exercises.filter((exercise) => exercise.exerciseId === exerciseId).flatMap((e) => e.sets);
    if (sets.length > 0) return sets;
  }
  return [];
}
