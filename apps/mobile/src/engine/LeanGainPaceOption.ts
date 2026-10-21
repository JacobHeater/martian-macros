import type { LeanGainPace } from '../domain/LeanGainPace';

/**
 * One lean-gain pace as it would apply to this person today (MM-480): the
 * pace it aims for, the surplus it means and the target that results.
 */
export interface LeanGainPaceOption {
  readonly pace: LeanGainPace;
  /** The pace aimed for, a share of body weight a week, once the surplus cap has acted. */
  readonly fraction: number;
  /** The daily surplus over expenditure, and the target that results. */
  readonly surplusKcal: number;
  readonly targetKcal: number;
  /** The surplus cap (MM-129) held it short of the pace asked for. */
  readonly capped: boolean;
}
