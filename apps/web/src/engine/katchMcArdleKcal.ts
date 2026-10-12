/**
 * Katch-McArdle resting energy expenditure from fat-free mass, kcal/day.
 * Preferred over Mifflin once body composition has converged.
 */
export function katchMcArdleKcal({ fatFreeMassKg }: { fatFreeMassKg: number }): number {
  return 370 + 21.6 * fatFreeMassKg;
}
