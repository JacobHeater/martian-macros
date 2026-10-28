import type { FoodEntry } from '../../../domain/FoodEntry';
import { usualServing } from '../../../domain/food/portion/usualServing';
import type { MealAfter } from './MealAfter';
import { mealAfterOf } from './mealAfterOf';
import type { MealMove } from './MealMove';
import type { MoveFood } from './MoveFood';
import { MoveRule } from './MoveRule';

/**
 * The outlier cut for next time (MM-684): to one of its usual servings
 * when it was logged as `MoveRule.cutToOneServingFrom` or more of them,
 * otherwise to half. Undefined when a safeguard forbids lowering intake,
 * or when the food is too small to be worth it.
 */
export function cutPortionOf(input: {
  readonly entry: FoodEntry;
  readonly food: MoveFood;
  readonly meal: MealAfter;
  readonly noLowering: boolean;
}): Extract<MealMove, { kind: 'cutPortion' }> | undefined {
  if (input.noLowering || input.food.kcal < MoveRule.outlierMinKcal) return undefined;
  const usual = usualServing(input.entry);
  const keepShare = usual !== undefined && usual.servings >= MoveRule.cutToOneServingFrom ? 1 / usual.servings : MoveRule.halfKept;
  const kcalSaved = input.food.kcal * (1 - keepShare);
  const proteinLostG = input.food.proteinG * (1 - keepShare);
  return {
    kind: 'cutPortion',
    food: input.food,
    keepShare,
    kcalSaved,
    proteinLostG,
    mealAfter: mealAfterOf(input.meal.kcal - kcalSaved, input.meal.proteinG - proteinLostG),
  };
}
