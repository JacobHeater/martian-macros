import { Exercise } from '../domain/training/Exercise';

/**
 * What an exercise of a workout is called: its name; "Other exercise" for
 * a set imported from a movement the library cannot place (MM-189,
 * MM-490); "Deleted exercise" for one of the user's own since deleted.
 */
export function exerciseNameOf(exerciseId: string, exercise: Exercise | undefined): string {
  if (exerciseId === Exercise.otherId) return 'Other exercise';
  return exercise?.name ?? 'Deleted exercise';
}
