import { PortionUnit } from '../domain/food/portion/PortionUnit';
import { servingVolume } from '../domain/food/portion/servingVolume';
import type { CatalogServing } from '../foodCatalog/CatalogServing';
import type { AmountChoice } from './AmountChoice';

/**
 * Volumes a food stated per 100 g can be measured in (MM-636), weighed
 * through the first of its servings that is a volume with a gram weight ("1
 * cup, chopped" of 128 g, or one the pack states in millilitres, MM-650):
 * cups, tablespoons and teaspoons, and fluid ounces and millilitres for one
 * stated in them, as a drink's are. None when no serving is such a volume:
 * no density is ever guessed (MM-167). A unit the serving already is, one of
 * it, is left out, as its own chip says it. A food stated per 100 mL needs no
 * serving for this: every volume is exact (the amount step offers them).
 */
export function volumeChoices(servings: readonly CatalogServing[]): AmountChoice[] {
  const volumeOf = (serving: CatalogServing) => serving.milliliters ?? servingVolume(serving.description);
  const basis = servings.find((serving) => (serving.grams ?? 0) > 0 && volumeOf(serving) !== undefined);
  if (basis === undefined) return [];
  const ml = volumeOf(basis) as number;
  const liquid = basis.milliliters !== undefined || /\b(?:fl\.?\s*oz|fluid|ml|millilit|lit(?:er|re))/i.test(basis.description);
  const units: readonly PortionUnit[] = ['cup', 'tablespoon', 'teaspoon', ...(liquid ? (['fluidOunce', 'milliliter'] as const) : [])];
  return units.filter((unit) => PortionUnit.milliliters(unit) !== ml).map((unit) => ({ unit, serving: basis }));
}
