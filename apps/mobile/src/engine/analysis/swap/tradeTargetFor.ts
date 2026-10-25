import type { GoalMode } from '../../../domain/GoalMode';
import { TradeRule } from '../TradeRule';
import type { TradeTarget } from '../TradeTarget';

/**
 * The band of calories Y may have a time against X's `kcal` (MM-607):
 * `kcalFloorRatio` to `kcalCeilingRatio` of X's, so a trade is not "eat
 * less" in disguise; on lean gain at least `leanGainFloorRatio` of X's, with
 * no ceiling.
 */
export function tradeTargetFor(goal: GoalMode, kcal: number): TradeTarget {
  return goal === 'leanGain'
    ? { minKcal: TradeRule.leanGainFloorRatio * kcal, maxKcal: undefined }
    : { minKcal: TradeRule.kcalFloorRatio * kcal, maxKcal: TradeRule.kcalCeilingRatio * kcal };
}
