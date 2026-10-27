import type { HandSize } from '../hand/HandSize';
import { gramsFor } from './gramsFor';
import { millilitersFor } from './millilitersFor';
import { PortionUnit } from './PortionUnit';
import type { ReferenceNutrition } from './ReferenceNutrition';

/**
 * How many of a food's reference amounts `quantity` of `unit` comes to
 * (MM-167, MM-650): the grams eaten over 100 for a food stated per 100 g,
 * the millilitres over 100 for one stated per 100 mL, the servings for one
 * stated per serving. Undefined when the amount cannot be turned into the
 * reference's basis without guessing. The one place a quantity becomes a
 * multiple of the reference: the macros, the extras and the micronutrients
 * all scale by it, so they never disagree.
 */
export function referenceAmounts(
  quantity: number,
  unit: PortionUnit,
  reference: ReferenceNutrition,
  { hand }: { hand?: HandSize | undefined } = {},
): number | undefined {
  if (!(quantity > 0) || !Number.isFinite(quantity)) return undefined;
  switch (reference.basis) {
    case 'perServing': {
      if (unit === 'serving' || unit === reference.servingUnit) return quantity;
      const servingMl = reference.servingMilliliters;
      const ml = PortionUnit.milliliters(unit);
      if (ml !== undefined && servingMl !== undefined && servingMl > 0) return (quantity * ml) / servingMl;
      const grams = gramsFor(quantity, unit, reference, { hand });
      const servingGrams = reference.servingGrams;
      if (grams !== undefined && servingGrams !== undefined && servingGrams > 0) return grams / servingGrams;
      return undefined;
    }
    case 'per100g': {
      const grams = gramsFor(quantity, unit, reference, { hand });
      return grams === undefined ? undefined : grams / 100;
    }
    case 'per100ml': {
      const ml = millilitersFor(quantity, unit, reference);
      return ml === undefined ? undefined : ml / 100;
    }
  }
}
