import { PortionUnit } from '../domain/food/portion/PortionUnit';
import { servingVolume } from '../domain/food/portion/servingVolume';
import type { CatalogServing } from '../foodCatalog/CatalogServing';
import type { AmountChoice } from './AmountChoice';

/**
 * Volumes a food can be measured in (MM-636), weighed through the first of
 * its servings that the source states as a volume with a gram weight ("1 cup,
 * chopped" of 128 g): cups, tablespoons and teaspoons, and fluid ounces and
 * millilitres for one stated in them, as a drink's are. None when no serving
 * is a volume: no density is ever guessed (MM-167). A unit the serving
 * already is, one of it, is left out, as its own chip says it.
 */
export function volumeChoices(servings: readonly CatalogServing[]): AmountChoice[] {
  const basis = servings.find((serving) => serving.grams > 0 && servingVolume(serving.description) !== undefined);
  if (basis === undefined) return [];
  const ml = servingVolume(basis.description) as number;
  const liquid = /\b(?:fl\.?\s*oz|fluid|ml|millilit|lit(?:er|re))/i.test(basis.description);
  const units: readonly PortionUnit[] = ['cup', 'tablespoon', 'teaspoon', ...(liquid ? (['fluidOunce', 'milliliter'] as const) : [])];
  return units.filter((unit) => PortionUnit.milliliters(unit) !== ml).map((unit) => ({ unit, serving: basis }));
}
