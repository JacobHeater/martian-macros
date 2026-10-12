import type { ProgressionKind } from './ProgressionKind';

/**
 * What to try for the first set of an exercise, and why (MM-79). It is
 * shown and pre-filled, never imposed.
 */
export interface ProgressionSuggestion {
  readonly kind: ProgressionKind;

  /** The load suggested, in the exercise's own meaning of load. */
  readonly loadKg: number;

  /** The reps suggested; for adding reps it means that many or more. */
  readonly reps: number;

  /** Last session's top load, and the reps of each set done at it. */
  readonly lastLoadKg: number;
  readonly lastReps: readonly number[];

  /** The top of the rep range the suggestion was made within. */
  readonly rangeTop: number;
}
