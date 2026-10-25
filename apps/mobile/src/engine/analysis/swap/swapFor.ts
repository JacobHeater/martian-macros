import type { CoachAdviceReplacement } from '../CoachAdviceReplacement';
import { tableSwapOf } from '../food/tableSwapOf';
import { catalogSwapOf } from './catalogSwapOf';
import { ownSwapOf } from './ownSwapOf';
import type { SwapInput } from './SwapInput';
import { swapLimitsOf } from './swapLimitsOf';

/**
 * What goes in a food's place (MM-617), in order, the first that gives one:
 * 1. a food the person logs in the same meal slot, by MM-607's trade (`ownSwapOf`);
 * 2. the catalog's nearest better food in the food's group, by name and preparation (`catalogSwapOf`);
 * 3. the coach's table of classic swaps (`tableSwapOf`), whose `name` is the row's words for the person.
 *
 * Undefined when nothing qualifies or a safeguard forbids it: nothing at
 * all under 18, paused, with the under-eating finding, after bariatric
 * surgery or with an eating-disorder history; no protein-motivated swap
 * (or one adding `TradeRule.proteinGainG` of protein) with kidney disease;
 * no carbohydrate-lowering swap on insulin or a sulfonylurea; no
 * calorie-lowering swap in pregnancy, breastfeeding, underweight or low
 * body weight (`swapLimitsOf`, `swapAllowed`).
 */
export function swapFor(input: SwapInput): CoachAdviceReplacement | undefined {
  const limits = swapLimitsOf(input.safeguards, input.cautions, input.goal);
  if (limits === undefined) return undefined;
  return ownSwapOf(input, limits) ?? catalogSwapOf(input, limits) ?? tableSwapOf(input.food, input.group, limits);
}
