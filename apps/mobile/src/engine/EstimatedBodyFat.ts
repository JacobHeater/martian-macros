import type { BodyFatBasis } from './BodyFatBasis';
import type { BodyFatEstimate } from './BodyFatEstimate';

/**
 * The body-fat estimate the coach works from and what it rests on
 * (MM-34). A range with its uncertainty, never a reading: callers show
 * `lowerPercent` to `upperPercent`, not `percent`.
 */
export interface EstimatedBodyFat {
  readonly estimate: BodyFatEstimate;
  readonly basis: BodyFatBasis;

  /** How many waist entries went into it; 0 unless `basis` is `waist`. */
  readonly waistEntries: number;
}
