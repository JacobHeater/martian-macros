import type { FatLossPace } from './FatLossPace';
import type { PaceLimit } from './PaceLimit';
import type { PaceWithheldReason } from './PaceWithheldReason';

/**
 * One fat-loss pace as it would apply to this person today (MM-128): what
 * it costs, what results, and what limits it, so the choice is made with
 * the figures in view.
 */
export interface PaceOption {
  readonly pace: FatLossPace;
  /** The pace asked for, as a fraction of body weight a week. */
  readonly fraction: number;
  /** Whether it may be chosen; otherwise why not. */
  readonly offered: boolean;
  readonly withheld: PaceWithheldReason | undefined;
  /** The daily deficit it means for this person today, and the target that results. */
  readonly deficitKcal: number;
  readonly targetKcal: number;
  /** The pace the deficit actually delivers, once a limit has acted. */
  readonly achievedFraction: number;
  /** What held the deficit short of the pace asked for, if anything. */
  readonly limitedBy: PaceLimit | undefined;
  /** The deficit is above what the body fat can supply in a day, by the model; a note, not a limit. */
  readonly aboveFatSupply: boolean;
}
