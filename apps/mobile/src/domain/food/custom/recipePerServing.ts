import { NutritionTotals } from '../portion/NutritionTotals';
import type { RecipeIngredient } from './RecipeIngredient';

/**
 * One serving of a recipe: the summed ingredients divided by `servings`
 * (MM-45). Undefined when `servings` is not above zero.
 */
export function recipePerServing(
  ingredients: readonly RecipeIngredient[],
  servings: number,
): NutritionTotals | undefined {
  if (!(servings > 0) || !Number.isFinite(servings)) return undefined;
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const i of ingredients) {
    kcal += i.totals.kcal;
    protein += i.totals.proteinG;
    carbs += i.totals.carbsG;
    fat += i.totals.fatG;
  }
  return new NutritionTotals({
    kcal: kcal / servings,
    proteinG: protein / servings,
    carbsG: carbs / servings,
    fatG: fat / servings,
  });
}
