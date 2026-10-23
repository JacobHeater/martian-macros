import { CustomFood } from '../../domain/food/custom/CustomFood';
import { recipePerServing } from '../../domain/food/custom/recipePerServing';
import type { MealDraft } from '../../domain/food/meal/MealDraft';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';

/**
 * A meal as a recipe for Saved (MM-586, MM-587): one serving made of its
 * items, each with its grams and totals, weighing what they weigh together.
 * A copy: changing either never changes the other. A recipe keeps calories
 * and macros only, as every recipe does (MM-45).
 */
export function recipeOfMeal(draft: MealDraft): CustomFood {
  const ingredients = draft.items.map((item) => ({
    name: item.name,
    grams: item.grams,
    totals: new NutritionTotals({ kcal: item.kcal ?? 0, proteinG: item.proteinG ?? 0, carbsG: item.carbsG ?? 0, fatG: item.fatG ?? 0 }),
  }));
  const grams = draft.items.reduce((sum, item) => sum + (item.grams ?? 0), 0);
  return new CustomFood({
    id: 0,
    name: draft.name.trim(),
    kind: 'recipe',
    servingDescription: '1 serving',
    perServing: recipePerServing(ingredients, 1) as NutritionTotals,
    servingGrams: grams > 0 ? grams : undefined,
    servings: 1,
    cookedWeightGrams: grams > 0 ? grams : undefined,
    ingredients,
  });
}
