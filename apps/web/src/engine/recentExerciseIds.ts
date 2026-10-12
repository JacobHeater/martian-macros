import type { Workout } from '../domain/training/Workout';

/**
 * The exercises the user has done, most recently used first, each once
 * (MM-76). Within one workout they keep the order they were done in.
 */
export function recentExerciseIds(workouts: Iterable<Workout>): string[] {
  const newestFirst = [...workouts].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  const seen = new Set<string>();
  for (const workout of newestFirst) {
    for (const exercise of workout.exercises) seen.add(exercise.exerciseId);
  }
  return [...seen];
}
