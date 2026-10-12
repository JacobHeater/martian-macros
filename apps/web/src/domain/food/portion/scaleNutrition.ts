import type { HandSize } from '../hand/HandSize';
import { gramsFor } from './gramsFor';
import type { NutritionTotals } from './NutritionTotals';
import { PortionUnit } from './PortionUnit';
import type { ReferenceNutrition } from './ReferenceNutrition';

/**
 * Totals for eating `quantity` of `unit` of the food described by
 * `reference`, or undefined when the amount cannot be turned into the
 * reference's basis without guessing (MM-167).
 *
 * This is the one place a quantity scales nutrition. It is applied once, to
 * reference values; totals the user typed are never passed through it.
 */
export function scaleNutrition(
  quantity: number,
  unit: PortionUnit,
  reference: ReferenceNutrition,
  { hand }: { hand?: HandSize | undefined } = {},
): NutritionTotals | undefined {
  if (!(quantity > 0) || !Number.isFinite(quantity)) return undefined;
  switch (reference.basis) {
    case 'perServing': {
      if (unit === 'serving' || unit === reference.servingUnit) {
        return reference.nutrition.times(quantity);
      }
      const servingGrams = reference.servingGrams;
      const servingMl = reference.servingMilliliters;
      const ml = PortionUnit.milliliters(unit);
      if (ml !== undefined && servingMl !== undefined && servingMl > 0) {
        return reference.nutrition.times((quantity * ml) / servingMl);
      }
      const grams = gramsFor(quantity, unit, reference, { hand });
      if (grams !== undefined && servingGrams !== undefined && servingGrams > 0) {
        return reference.nutrition.times(grams / servingGrams);
      }
      return undefined;
    }
    case 'per100g': {
      const grams = gramsFor(quantity, unit, reference, { hand });
      return grams === undefined ? undefined : reference.nutrition.times(grams / 100);
    }
    case 'per100ml': {
      const ml = PortionUnit.milliliters(unit);
      if (ml !== undefined) return reference.nutrition.times((quantity * ml) / 100);
      const grams = PortionUnit.grams(unit);
      const density = reference.densityGPerMl;
      if (grams !== undefined && density !== undefined && density > 0) {
        return reference.nutrition.times((quantity * grams) / density / 100);
      }
      return undefined;
    }
  }
}
