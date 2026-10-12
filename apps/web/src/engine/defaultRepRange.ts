import type { Exercise } from '../domain/training/Exercise';

/**
 * The rep range a suggestion works within (MM-79), bottom and top: 6 to 10
 * for a barbell lift and 8 to 12 otherwise. These are conventions, not
 * optima; the evidence does not single out a range.
 */
export function defaultRepRange(exercise: Exercise | undefined): readonly [low: number, high: number] {
  return exercise?.equipment === 'barbell' ? [6, 10] : [8, 12];
}
