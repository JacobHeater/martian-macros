import type { CandidateFood } from './CandidateFood';

/**
 * What to do when two sources describe the same barcode and both passed the
 * nutrition checks.
 */
export interface ConflictResolution {
  readonly winner: CandidateFood;

  /**
   * The two records differ by more than 10% (energy or a macro), so the
   * food should be marked for the user to check.
   */
  readonly disagree: boolean;
}
