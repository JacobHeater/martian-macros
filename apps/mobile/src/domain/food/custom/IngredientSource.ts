/**
 * The pack food a recipe's ingredient was found as (MM-456): the pack's id
 * and the food's id in it. A line typed as totals has none.
 */
export interface IngredientSource {
  readonly packId: string;
  readonly foodId: number;
}
