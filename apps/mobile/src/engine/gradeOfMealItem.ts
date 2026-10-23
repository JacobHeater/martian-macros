import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import type { MealItemDraft } from '../domain/food/meal/MealItemDraft';
import { mealItemProblems } from '../domain/food/meal/mealItemProblems';
import { gradeMicrosFrom } from './gradeMicrosFrom';
import { gradeOfNutrition } from './gradeOfNutrition';

/**
 * The grade of one food of an analysed meal before it is logged (MM-586):
 * the food itself per 100 g, as a logged food's is (MM-382). None while the
 * item has a problem, since a number it needs may be missing or wrong.
 */
export function gradeOfMealItem(item: MealItemDraft): FoodGradeValue | undefined {
  const { grams, kcal, proteinG, carbsG } = item;
  if (mealItemProblems(item).length > 0 || grams === undefined || kcal === undefined || proteinG === undefined || carbsG === undefined) {
    return undefined;
  }
  const scale = 100 / grams;
  const per100 = (value: number | undefined) => (value === undefined ? undefined : value * scale);
  return gradeOfNutrition({
    kcal: kcal * scale,
    proteinG: proteinG * scale,
    carbsG: carbsG * scale,
    fiberG: per100(item.fiberG),
    sodiumMg: per100(item.micros.of('sodium')),
    sugarsG: per100(item.micros.of('sugars')),
    saturatedFatG: per100(item.micros.of('saturatedFat')),
    alcoholG: undefined,
    micros: gradeMicrosFrom((n) => item.micros.of(n), scale),
  });
}
