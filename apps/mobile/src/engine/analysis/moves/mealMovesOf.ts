import type { FoodEntry } from '../../../domain/FoodEntry';
import { countsAsFood } from '../food/countsAsFood';
import { foodLimitsOf } from '../food/foodLimitsOf';
import { foodMovesOf } from './foodMovesOf';
import type { MealMove } from './MealMove';
import type { MealMoves } from './MealMoves';
import type { MealMovesInput } from './MealMovesInput';
import { MoveRule } from './MoveRule';
import { nextMealOf } from './nextMealOf';

const sum = (entries: readonly FoodEntry[], of: (e: FoodEntry) => number) => entries.reduce((s, e) => s + of(e), 0);

/**
 * A meal's moves (MM-684), ranked by the day's gap (the owner, 2026-10-28):
 * when the protein to go cannot fit inside the calories left, today's
 * `nextMeal` order comes first; otherwise the meal's own fix for next time
 * (`foodMovesOf` on the outlier); `nextMeal` last while protein remains
 * today and no meal fix exists. The outlier is MM-666's: the food that
 * counts with the most calories not backed by protein at the day's target
 * density, worth a move from `MoveRule.outlierMinKcal`. Nothing on the
 * protected path, nothing under 18, paused or after bariatric surgery.
 */
export function mealMovesOf(input: MealMovesInput): MealMoves {
  const limits = foodLimitsOf(input.safeguards);
  if (limits.nothing || limits.minorOrPaused || limits.proteinOnly) return { outlier: undefined, moves: [], best: undefined };

  const targetDensity = input.dailyKcalTarget > 0 ? (input.dailyProteinTargetG * 4) / input.dailyKcalTarget : 0;
  const densityOf = (e: FoodEntry) => (e.kcal > 0 ? (e.proteinG * 4) / e.kcal : 0);
  const unbackedOf = (e: FoodEntry) => e.kcal - (targetDensity > 0 ? (e.proteinG * 4) / targetDensity : 0);
  const countable = input.mealEntries.filter((e) => countsAsFood(e) && e.kcal > 0);
  const worst = [...countable].sort((a, b) => unbackedOf(b) - unbackedOf(a) || densityOf(a) - densityOf(b))[0];
  const outlier =
    worst === undefined || worst.kcal < MoveRule.outlierMinKcal || densityOf(worst) >= targetDensity
      ? undefined
      : { name: worst.name.trim(), kcal: worst.kcal, proteinG: worst.proteinG, fatG: worst.fatG, source: 'logged' as const, proteinDensity: densityOf(worst) };

  const kcalLeft = input.dailyKcalTarget - sum(input.dayEntries, (e) => e.kcal);
  const proteinToGoG = Math.max(0, input.dailyProteinTargetG - sum(input.dayEntries, (e) => e.proteinG));
  const today =
    proteinToGoG > 0 && !limits.noMoreProtein
      ? nextMealOf({
          meal: input.meal,
          kcalLeft,
          proteinToGoG,
          plate: input.mealEntries,
          history: input.history,
          catalog: input.catalog,
          snoozed: input.snoozed,
        })
      : undefined;
  const fixes: readonly MealMove[] = worst === undefined || outlier === undefined ? [] : foodMovesOf(input, worst);

  const moves: MealMove[] = today !== undefined && !today.fits ? [today, ...fixes] : today !== undefined ? [...fixes, today] : [...fixes];
  return { outlier, moves, best: moves[0] };
}
