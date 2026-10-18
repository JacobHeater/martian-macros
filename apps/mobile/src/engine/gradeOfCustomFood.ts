import type { CustomFood } from '../domain/food/custom/CustomFood';
import { recipeServingGrams } from '../domain/food/custom/recipeServingGrams';
import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import { gradeOfNutrition } from './gradeOfNutrition';

/**
 * A grade for a food of the person's own (MM-370): its serving's values
 * scaled to 100 g. A recipe can't be graded: its ingredients carry only the
 * four macros, so it has no sugars, saturated fat, sodium or fiber (the
 * panel's NU-4). A food whose serving has no weight can't be graded per
 * 100 g.
 */
export function gradeOfCustomFood(food: CustomFood): FoodGradeValue {
  if (food.kind === 'recipe') {
    return { kind: 'ungradable', reason: 'Recipes can’t be graded yet: their ingredients don’t carry sugars, saturated fat, sodium or fiber.' };
  }
  const grams = food.servingGrams ?? (food.servings === undefined ? undefined : recipeServingGrams(food.cookedWeightGrams, food.servings));
  if (grams === undefined || !(grams > 0)) {
    return { kind: 'ungradable', reason: 'The serving’s weight in grams isn’t known, so the food can’t be graded per 100 g.' };
  }
  const per100 = (value: number | undefined) => (value === undefined ? undefined : (value / grams) * 100);
  return gradeOfNutrition({
    kcal: (food.perServing.kcal / grams) * 100,
    proteinG: (food.perServing.proteinG / grams) * 100,
    sugarsG: per100(food.micros.of('sugars')),
    saturatedFatG: per100(food.micros.of('saturatedFat')),
    sodiumMg: per100(food.micros.of('sodium')),
    fiberG: per100(food.fiberG),
    alcoholG: undefined,
  });
}
