import { roundTo50 } from './roundTo50';

/** The energy of a regular meal: a third of maintenance, rounded to 50 kcal. */
export function regularMealKcal(maintenanceKcal: number): number {
  return roundTo50(maintenanceKcal / 3);
}
