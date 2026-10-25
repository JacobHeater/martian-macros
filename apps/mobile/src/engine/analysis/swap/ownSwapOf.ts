import type { CoachAdviceReplacement } from '../CoachAdviceReplacement';
import type { CoachTrade } from '../CoachTrade';
import { foodKeyOf } from '../food/foodKeyOf';
import { findTrades } from '../findTrades';
import { foodTagsOf } from '../language/foodTagsOf';
import type { SwapInput } from './SwapInput';
import type { SwapLimits } from './SwapLimits';
import { swapAllowed } from './swapAllowed';
import { sweetForMeal } from './sweetForMeal';

/** The motives a swap of one's own food is tried for, in order. */
const motives: readonly CoachTrade['motive'][] = ['fat', 'calories', 'protein', 'sodium'];

/**
 * The first step of a swap (MM-617): a food the person logs in the same
 * meal slot, by MM-607's trade (`findTrades`) with every safeguard it
 * keeps, tried for fat, then calories, protein and sodium. X is the food's
 * entries in the history (at its meal, where it was logged there), taken
 * as a one-day span so a food logged once qualifies; Y is a food logged in
 * that slot on `TradeRule.loggedMinDays` days, or a saved food logged there.
 * Never a dessert, candy or snack food in a meal food's place, and never
 * what the limits forbid. Undefined when no food of the person's qualifies.
 */
export function ownSwapOf(input: SwapInput, limits: SwapLimits): CoachAdviceReplacement | undefined {
  const key = input.food.key;
  const all = input.history.filter((e) => foodKeyOf(e) === key);
  const atMeal = input.meal === undefined ? all : all.filter((e) => e.meal === input.meal);
  const spanEntries = atMeal.length > 0 ? atMeal : all;
  if (spanEntries.length === 0) return undefined;
  const foodTags = foodTagsOf(input.food.name);
  for (const motive of motives) {
    const trades = findTrades({
      motive,
      goal: input.goal,
      spanEntries,
      history: input.history,
      catalog: undefined,
      safeguards: input.safeguards,
      cautions: input.cautions,
      activeSignals: new Set<string>(),
      calorieRoom: false,
      spanDays: 1,
    });
    for (const trade of trades) {
      if (trade.source === 'catalog' || trade.x.name.trim().toLowerCase() !== key) continue;
      if (sweetForMeal(foodTags, foodTagsOf(trade.y.name))) continue;
      // `findTrades` has kept the carbohydrate and calorie safeguards with both entries' figures; the protein gain is the swap's.
      if (!swapAllowed(trade.x, trade.y, { ...limits, noCarbDrop: false })) continue;
      return { name: trade.y.name, kcal: trade.y.kcal, proteinG: trade.y.proteinG, fatG: trade.y.fatG, source: trade.source };
    }
  }
  return undefined;
}
