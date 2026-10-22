import type { NutritionTotals } from '../portion/NutritionTotals';
import type { RecipeIngredient } from './RecipeIngredient';

/**
 * `line` at `grams`, its totals worked out again from its food's numbers per
 * 100 g as they are now (MM-456). Undefined for a weight not above zero.
 * The line keeps its name and its source.
 */
export function reweighedIngredient(
  line: RecipeIngredient,
  per100g: NutritionTotals,
  grams: number,
): RecipeIngredient | undefined {
  if (!(grams > 0) || !Number.isFinite(grams)) return undefined;
  return { ...line, grams, totals: per100g.times(grams / 100) };
}
