import { NutritionTotals } from '../portion/NutritionTotals';
import { MealKind } from './MealKind';
import { mealKcal } from './mealKcal';
import type { MealSize } from './MealSize';

/**
 * Totals for a rough estimate of a `size` meal of `kind` (MM-150). Energy is
 * the size's, rounded to 50 kcal; grams follow from the kind's split at 4
 * kcal per gram of protein and carbohydrate and 9 per gram of fat.
 */
export function estimateMeal(
  size: MealSize,
  kind: MealKind,
  { maintenanceKcal }: { maintenanceKcal: number },
): NutritionTotals {
  const kcal = mealKcal(size, maintenanceKcal);
  const split = MealKind.split(kind);
  return new NutritionTotals({
    kcal,
    proteinG: (kcal * split.protein) / 4,
    carbsG: (kcal * split.carbs) / 4,
    fatG: (kcal * split.fat) / 9,
  });
}
