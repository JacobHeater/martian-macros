import type { HandSize } from '../hand/HandSize';
import { gramsFor } from './gramsFor';
import { PortionUnit } from './PortionUnit';
import type { ReferenceNutrition } from './ReferenceNutrition';

/** A unit and the food it is counted for: the reference it converts through, or none for typed totals. */
interface Measure {
  readonly unit: PortionUnit;
  readonly reference?: ReferenceNutrition | undefined;
}

/**
 * `quantity` of `from` said in `to`, the same portion (MM-628), or
 * undefined when the two share no exact measure: a hand portion either way
 * (an estimate, MM-46), a serving with no weight, a volume the food cannot
 * weigh. Weight converts to weight and volume to volume by their constants;
 * anything else goes through the grams each unit is for its food, never a
 * guessed density (MM-167).
 */
export function convertedQuantity(
  quantity: number,
  from: Measure,
  to: Measure,
  { hand }: { hand?: HandSize | undefined } = {},
): number | undefined {
  if (!(quantity > 0) || !Number.isFinite(quantity)) return undefined;
  if (PortionUnit.isHand(from.unit) || PortionUnit.isHand(to.unit)) return undefined;
  if (from.unit === to.unit && from.reference === to.reference) return quantity;
  const fromGrams = PortionUnit.grams(from.unit);
  const toGrams = PortionUnit.grams(to.unit);
  if (fromGrams !== undefined && toGrams !== undefined) return (quantity * fromGrams) / toGrams;
  const fromMl = PortionUnit.milliliters(from.unit);
  const toMl = PortionUnit.milliliters(to.unit);
  if (fromMl !== undefined && toMl !== undefined) return (quantity * fromMl) / toMl;
  if (from.reference === undefined || to.reference === undefined) return undefined;
  const grams = gramsFor(quantity, from.unit, from.reference, { hand });
  const perUnit = gramsFor(1, to.unit, to.reference, { hand });
  return grams === undefined || perUnit === undefined || !(perUnit > 0) ? undefined : grams / perUnit;
}
