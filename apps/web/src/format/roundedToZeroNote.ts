import type { CatalogFood, CatalogServing } from '../foodCatalog';

/**
 * Labels may declare under 5 kcal as zero, which adds up for foods eaten in
 * many small servings (MM-153). Returns the note for `food` eaten as
 * `serving`, or undefined when it does not apply.
 */
export function roundedToZeroNote(food: CatalogFood, serving: CatalogServing): string | undefined {
  const perServing = (food.kcal * serving.grams) / 100;
  if (serving.grams >= 5 || perServing >= 0.5) return undefined;
  return 'Labels may round small servings to zero. Many servings add up.';
}
