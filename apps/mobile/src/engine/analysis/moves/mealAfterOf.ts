import type { MealAfter } from './MealAfter';

/** A meal's figures after a move (MM-684). */
export function mealAfterOf(kcal: number, proteinG: number): MealAfter {
  return { kcal, proteinG, proteinDensity: kcal > 0 ? (proteinG * 4) / kcal : 0 };
}
