import type { Workout } from '../domain/training/Workout';
import { isHardSet } from './isHardSet';

/**
 * Whether a workout is a training session (MM-609): at least one hard set
 * (`isHardSet`). An imported session with no sets, or only sets without
 * reps, is not training.
 */
export function hasHardSet(workout: Workout): boolean {
  return workout.exercises.some((entry) => entry.sets.some(isHardSet));
}
