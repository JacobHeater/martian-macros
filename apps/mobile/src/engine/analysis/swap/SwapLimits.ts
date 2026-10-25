import type { GoalMode } from '../../../domain/GoalMode';

/**
 * What the safeguards leave a swap (MM-617, MM-607), when they leave one
 * at all (`swapLimitsOf`).
 */
export interface SwapLimits {
  readonly goal: GoalMode;
  /** Pregnancy, breastfeeding, underweight or low body weight: no swap with fewer calories than the food. */
  readonly noFewerKcal: boolean;
  /**
   * Insulin or a sulfonylurea: no swap with more than `TradeRule.insulinCarbDropG`
   * less carbohydrate, and none when either side's carbohydrate is not known.
   */
  readonly noCarbDrop: boolean;
  /** Kidney disease: no swap for protein, and none adding `TradeRule.proteinGainG` of protein or more. */
  readonly noProteinGain: boolean;
}
