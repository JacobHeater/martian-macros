import type { NutritionTotals } from '../portion/NutritionTotals';
import type { IngredientSource } from './IngredientSource';

/**
 * One line of a recipe: what it is, how much, and the totals for that amount
 * as they were when the recipe was written (MM-45). Totals are stored, not
 * looked up, so a recipe never changes because a food pack did.
 */
export interface RecipeIngredient {
  readonly name: string;

  /** The weight used, when it was entered by weight. */
  readonly grams?: number | undefined;
  readonly totals: NutritionTotals;

  /**
   * The pack food it was found as (MM-456), so its weight can be changed in
   * place; none for a line typed as totals.
   */
  readonly source?: IngredientSource | undefined;
}
