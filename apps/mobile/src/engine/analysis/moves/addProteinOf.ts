import type { FoodEntry } from '../../../domain/FoodEntry';
import type { Meal } from '../../../domain/Meal';
import type { TradeCatalog } from '../TradeCatalog';
import { leanProteinOf } from './leanProteinOf';
import type { MealAfter } from './MealAfter';
import { mealAfterOf } from './mealAfterOf';
import type { MealMove } from './MealMove';
import type { MoveFood } from './MoveFood';
import { MoveRule } from './MoveRule';

/**
 * A lean protein food added to the meal next time (MM-684): the one that
 * adds the most protein for at most `MoveRule.addMaxKcal`, the catalog
 * first, then the person's own foods at this slot. Undefined under kidney
 * disease (no more protein), or when none qualifies.
 */
export function addProteinOf(input: {
  readonly food: MoveFood;
  readonly meal: Meal;
  readonly mealAfter: MealAfter;
  readonly plate: readonly FoodEntry[];
  readonly history: readonly FoodEntry[];
  readonly catalog: TradeCatalog | undefined;
  readonly noMoreProtein: boolean;
  readonly snoozed?: ReadonlySet<string> | undefined;
}): Extract<MealMove, { kind: 'addProtein' }> | undefined {
  if (input.noMoreProtein) return undefined;
  const added = leanProteinOf({
    catalog: input.catalog,
    history: input.history,
    meal: input.meal,
    plate: input.plate,
    maxKcal: MoveRule.addMaxKcal,
    snoozed: input.snoozed,
  });
  if (added === undefined) return undefined;
  return {
    kind: 'addProtein',
    food: input.food,
    added,
    mealAfter: mealAfterOf(input.mealAfter.kcal + added.kcal, input.mealAfter.proteinG + added.proteinG),
  };
}
