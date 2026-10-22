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

  /** How many waist entries went into it; 0 unless the waist joined. */
  readonly waistEntries: number;

  /** How many days of smart-scale readings went into it (MM-502); none unless `basis` is `scale`. */
  readonly scaleDays?: number | undefined;
}
