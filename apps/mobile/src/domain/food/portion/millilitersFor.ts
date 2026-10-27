import { PortionUnit } from './PortionUnit';
import type { ReferenceNutrition } from './ReferenceNutrition';

/**
 * The millilitres in `quantity` of `unit` of the food described by
 * `reference` (MM-650), or undefined when that cannot be known without
 * guessing. The source's own serving counts by the millilitres it states, or
 * by its grams through a density; a volume is exact; a weight converts only
 * through the food's density. A hand portion has no volume.
 */
export function millilitersFor(quantity: number, unit: PortionUnit, reference: ReferenceNutrition): number | undefined {
  const density = reference.densityGPerMl;
  if (unit === 'serving' || unit === reference.servingUnit) {
    const servingMl = reference.servingMilliliters;
    if (servingMl !== undefined && servingMl > 0) return quantity * servingMl;
    const servingGrams = reference.servingGrams;
    if (servingGrams !== undefined && density !== undefined && density > 0) return (quantity * servingGrams) / density;
    if (unit === 'serving') return undefined;
  }
  const ml = PortionUnit.milliliters(unit);
  if (ml !== undefined) return quantity * ml;
  const grams = PortionUnit.grams(unit);
  if (grams !== undefined && density !== undefined && density > 0) return (quantity * grams) / density;
  return undefined;
}
