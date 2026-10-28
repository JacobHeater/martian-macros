import type { FoodEntry } from '../../../domain/FoodEntry';
import { foodLimitsOf } from '../food/foodLimitsOf';
import { addProteinOf } from './addProteinOf';
import { cutPortionOf } from './cutPortionOf';
import type { MealMove } from './MealMove';
import { mealAfterOf } from './mealAfterOf';
import type { MealMovesInput } from './MealMovesInput';
import type { MoveFood } from './MoveFood';
import { sameGroupSwapOf } from './sameGroupSwapOf';

/**
 * The meal's own fixes for next time with `entry` as the food to fix
 * (MM-684), ranked by the day's gap: while protein is still to go today,
 * the move that leaves the meal with the highest protein density first,
 * ties in the order swap, add, cut; with the day's protein covered, an add
 * only costs calories, so the swap stands first (the meal kept whole) and
 * the cut after it. The inline line under a food (MM-687) asks for its own; the
 * meal asks for its outlier's.
 */
export function foodMovesOf(input: MealMovesInput, entry: FoodEntry): readonly MealMove[] {
  const limits = foodLimitsOf(input.safeguards);
  if (limits.nothing || limits.minorOrPaused || limits.proteinOnly) return [];
  const sum = (of: (e: FoodEntry) => number) => input.mealEntries.reduce((s, e) => s + of(e), 0);
  const mealAfter = mealAfterOf(sum((e) => e.kcal), sum((e) => e.proteinG));
  const food: MoveFood = { name: entry.name.trim(), kcal: entry.kcal, proteinG: entry.proteinG, fatG: entry.fatG, source: 'logged' };
  const plate = input.mealEntries;
  const swap = sameGroupSwapOf({
    entry,
    food,
    meal: input.meal,
    mealAfter,
    plate,
    history: input.history,
    catalog: input.catalog,
    goal: input.goal,
    safeguards: input.safeguards,
    cautions: input.cautions,
    snoozed: input.snoozed,
  });
  const add = addProteinOf({
    food,
    meal: input.meal,
    mealAfter,
    plate,
    history: input.history,
    catalog: input.catalog,
    noMoreProtein: limits.noMoreProtein,
    snoozed: input.snoozed,
  });
  const cut = limits.underEating ? undefined : cutPortionOf({ entry, food, meal: mealAfter, noLowering: limits.noLowering });
  const proteinToGoG = input.dailyProteinTargetG - input.dayEntries.reduce((s, e) => s + e.proteinG, 0);
  const order = (m: MealMove) => (m.kind === 'swapSameGroup' ? 0 : m.kind === 'addProtein' ? 1 : 2);
  if (proteinToGoG > 0) {
    const moves = [swap, add, cut].filter((m): m is MealMove => m !== undefined);
    const density = (m: MealMove) => (m.kind === 'nextMeal' ? 0 : m.mealAfter.proteinDensity);
    return moves.sort((a, b) => density(b) - density(a) || order(a) - order(b));
  }
  return [swap, cut].filter((m): m is MealMove => m !== undefined);
}
