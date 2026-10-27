import type { CatalogFood, CatalogServing } from '../foodCatalog';

/**
 * Labels may declare under 5 kcal as zero, which adds up for foods eaten in
 * many small servings (MM-153). Returns the note for `food` eaten as
 * `serving`, or undefined when it does not apply.
 */
export function roundedToZeroNote(food: CatalogFood, serving: CatalogServing): string | undefined {
  // The serving in the food's own basis: grams, or millilitres for a drink stated per 100 mL (MM-650).
  const amount = food.basis === 'per100ml' ? serving.milliliters : serving.grams;
  if (amount === undefined) return undefined;
  const perServing = (food.kcal * amount) / 100;
  if (amount >= 5 || perServing >= 0.5) return undefined;
  return 'Labels may round small servings to zero. Many servings add up.';
}
