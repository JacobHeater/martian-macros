/** What a meal would be after a move (MM-684): its calories, protein and protein density. */
export interface MealAfter {
  readonly kcal: number;
  readonly proteinG: number;
  /** `(proteinG * 4) / kcal`, 0 for a meal with no calories. */
  readonly proteinDensity: number;
}
