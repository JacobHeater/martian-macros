import { MealSize } from './MealSize';
import { roundTo50 } from './roundTo50';

/**
 * The energy of a `size` meal for someone whose maintenance is
 * `maintenanceKcal`, rounded to 50 kcal (MM-150).
 */
export function mealKcal(size: MealSize, maintenanceKcal: number): number {
  return roundTo50((maintenanceKcal / 3) * MealSize.multiplier(size));
}
