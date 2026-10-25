import type { FoodEntry } from '../../../domain/FoodEntry';
import type { Meal } from '../../../domain/Meal';
import type { TrendDirection } from '../../trends/TrendDirection';
import type { CoachAdvice } from '../CoachAdvice';
import type { CoachAdviceFood } from '../CoachAdviceFood';
import type { CoachAdviceReplacement } from '../CoachAdviceReplacement';
import { CoachAdviceRule } from '../CoachAdviceRule';
import type { CoachFood } from '../CoachFood';
import type { CoachTrade } from '../CoachTrade';
import { adviceFoodOf } from './adviceFoodOf';
import { allowedOrders } from './allowedOrders';
import type { FoodLimits } from './FoodLimits';
import type { FoodSignalId } from './FoodSignalId';
import { foodsThatFit } from './foodsThatFit';
import { saucedOrFried } from './saucedOrFried';
import { tradeAdviceOf } from './tradeAdviceOf';

/**
 * The orders a span's fix ends in (MM-617), from the figures, the foods
 * that drove it and MM-607's trade, then the safeguards (`allowedOrders`),
 * with a fallback each, so every fix the safeguards let be said has one:
 *
 * - **protein short** (N1–N4, N16): the trade, or an add of a protein food
 *   the person logs, or of a protein food (at the meal, for N3 and N16);
 * - **fat over target**, **the split**, **calorie density**, **calories
 *   over**: the trade; else the top food swapped (`swap`: the person's
 *   foods, the catalog, the swap table) or halved; with no food named,
 *   halve the added fats (fat), add vegetables (density) or back to the
 *   target (calories);
 * - **fat under its minimum**, **carbohydrate under its floor**, **calories
 *   under on a lean gain**: an add;
 * - **fiber**: an add of vegetables, with a fiber food the person logs;
 * - **sodium**: the trade, or the top food swapped or halved, and sauce on
 *   the side when its foods were sauced or fried;
 * - **intake at energy use**: back to the target (fat loss) or an add (lean gain).
 *
 * `extra` (the meal breakdown of a day that drove the span) follows the
 * signal's own orders.
 */
export function spanAdviceOf({
  signal,
  direction,
  figures,
  foods,
  trade,
  entries,
  history,
  limits,
  meal,
  swap,
  extra = [],
}: {
  signal: FoodSignalId;
  direction: TrendDirection | undefined;
  figures: Readonly<Record<string, number>>;
  foods: readonly CoachFood[];
  trade: CoachTrade | undefined;
  /** The span's entries, where the named foods' figures are read. */
  entries: readonly FoodEntry[];
  /** The last 56 days, for a protein food the person logs. */
  history: readonly FoodEntry[];
  limits: FoodLimits;
  /** The meal a per-meal signal (N3, N16) read. */
  meal?: Meal | undefined;
  /** What goes in a food's place (`swapFor`), or undefined. */
  swap: (food: CoachAdviceFood) => CoachAdviceReplacement | undefined;
  extra?: readonly CoachAdvice[];
}): CoachAdvice[] {
  const top = foods[0];
  const food = top === undefined ? undefined : adviceFoodOf(top.name, entries);
  const traded: CoachAdvice[] = trade === undefined ? [] : [tradeAdviceOf(trade)];
  const at = meal === undefined ? {} : { meal };
  const plainProtein: CoachAdvice = { kind: 'add', nutrient: 'protein', ...at };
  const proteinAdd = (): CoachAdvice => {
    const own = limits.proteinOnly ? undefined : foodsThatFit(history, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)[0];
    return { ...plainProtein, ...(own === undefined ? {} : { addFood: own.name }) };
  };
  /** The top food: the trade's swap, or swapped or halved. */
  const lower = (): CoachAdvice[] => {
    if (traded.length > 0) return traded;
    if (food === undefined) return [];
    const replacement = swap(food);
    return [replacement === undefined ? { kind: 'halve', food } : { kind: 'swap', food, replacement }];
  };
  const target = figures['targetKcal'];
  const back: CoachAdvice = { kind: 'backToPlan', ...(target === undefined ? {} : { limitKcal: target }) };
  const vegetables: CoachAdvice = { kind: 'add', nutrient: 'fiber', addCategory: 'vegetables', amountCups: CoachAdviceRule.fiberCups };
  const moreCalories: CoachAdvice = { kind: 'add', nutrient: 'calories', amountKcal: CoachAdviceRule.leanGainAddKcal };
  let orders: CoachAdvice[] = [];
  let fallback: CoachAdvice[] = [];
  switch (signal) {
    case 'proteinMinimum':
    case 'proteinTarget':
    case 'proteinByMeal':
    case 'proteinDensity':
    case 'mealBalance':
      orders = traded.length > 0 ? traded : [proteinAdd()];
      fallback = [plainProtein];
      break;
    case 'fatAgainstTarget':
    case 'fatShare':
      orders = direction === 'down' ? [{ kind: 'add', nutrient: 'fat' }] : lower();
      fallback = direction === 'down' ? [] : [{ kind: 'halve', nutrient: 'fat' }];
      break;
    case 'macroSplit':
      orders = figures['largest'] === 0 ? (traded.length > 0 ? traded : [proteinAdd()]) : lower();
      fallback = figures['largest'] === 0 ? [plainProtein] : figures['largest'] === 2 ? [{ kind: 'halve', nutrient: 'fat' }] : [vegetables];
      break;
    case 'carbohydrate':
      orders = [{ kind: 'add', nutrient: 'carbohydrate' }];
      fallback = [];
      break;
    case 'calorieDensity':
      orders = lower();
      fallback = [vegetables];
      break;
    case 'fiber':
      orders = [{ ...vegetables, ...(top === undefined || limits.proteinOnly ? {} : { addFood: top.name }) }];
      fallback = [vegetables];
      break;
    case 'sodium':
      orders = [...lower(), ...(foods.some((f) => saucedOrFried(f.name)) ? [{ kind: 'sauceOnSide' as const }] : [])];
      fallback = [{ kind: 'sauceOnSide' }, { kind: 'drinkWater' }];
      break;
    case 'calories':
      orders = direction === 'down' ? [moreCalories] : lower();
      fallback = direction === 'down' ? [] : [back];
      break;
    case 'energyUse':
      orders = figures['direction'] === -1 ? [moreCalories] : [back];
      fallback = [];
      break;
  }
  return allowedOrders(limits, [...orders, ...extra], fallback);
}
