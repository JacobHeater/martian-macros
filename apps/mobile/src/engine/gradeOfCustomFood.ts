import type { CustomFood } from '../domain/food/custom/CustomFood';
import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import { gradeMicrosFrom } from './gradeMicrosFrom';
import { gradeOfNutrition } from './gradeOfNutrition';

/**
 * A grade for a food of the person's own (MM-382): its serving's values
 * scaled to 100 g. A recipe can't be graded: its ingredients carry only the
 * four macros, so it has no fiber or sodium, which the method requires. A
 * food whose serving has no weight has no calories per gram to grade.
 */
export function gradeOfCustomFood(food: CustomFood): FoodGradeValue {
  if (food.kind === 'recipe') {
    return { kind: 'ungradable', reason: 'Recipes can’t be graded yet: their ingredients don’t carry fiber or sodium.' };
  }
  const grams = food.servingGrams;
  if (grams === undefined || !(grams > 0)) {
    return { kind: 'ungradable', reason: 'The serving’s weight in grams isn’t known, so the food can’t be graded.' };
  }
  const scale = 100 / grams;
  const per100 = (value: number | undefined) => (value === undefined ? undefined : value * scale);
  return gradeOfNutrition({
    kcal: food.perServing.kcal * scale,
    proteinG: food.perServing.proteinG * scale,
    carbsG: food.perServing.carbsG * scale,
    fiberG: per100(food.fiberG),
    sodiumMg: per100(food.micros.of('sodium')),
    sugarsG: per100(food.micros.of('sugars')),
    saturatedFatG: per100(food.micros.of('saturatedFat')),
    alcoholG: undefined,
    micros: gradeMicrosFrom((n) => food.micros.of(n), scale),
  });
}
