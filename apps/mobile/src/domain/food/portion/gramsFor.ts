import { HandModel } from '../hand/HandModel';
import type { HandSize } from '../hand/HandSize';
import { PortionUnit } from './PortionUnit';
import type { ReferenceNutrition } from './ReferenceNutrition';

/**
 * The grams in `quantity` of `unit` of the food described by `reference`, or
 * undefined when that cannot be known without guessing (MM-167).
 *
 * A weight is exact. A volume converts only through the food's own density,
 * or through a serving the source defines in both volume and weight; there is
 * no generic density. A serving converts only when it has a gram weight. A
 * hand portion converts through the hand model, and only when `hand` is
 * given (MM-46).
 */
export function gramsFor(
  quantity: number,
  unit: PortionUnit,
  reference: ReferenceNutrition,
  { hand }: { hand?: HandSize | undefined } = {},
): number | undefined {
  const servingGrams = reference.servingGrams;
  if (servingGrams !== undefined && unit === reference.servingUnit) {
    return quantity * servingGrams;
  }
  if (PortionUnit.isHand(unit)) {
    if (hand === undefined) return undefined;
    const each = HandModel.gramsOf(unit, hand, {
      densityGPerMl: reference.densityGPerMl,
      per100g: reference.basis === 'per100g' ? reference.nutrition : undefined,
    });
    return each === undefined ? undefined : quantity * each;
  }
  const weight = PortionUnit.grams(unit);
  if (weight !== undefined) return quantity * weight;
  const ml = PortionUnit.milliliters(unit);
  if (ml !== undefined) {
    const volume = quantity * ml;
    const density = reference.densityGPerMl;
    if (density !== undefined) return volume * density;
    const servingMl = reference.servingMilliliters;
    if (servingMl !== undefined && servingGrams !== undefined && servingMl > 0) {
      return (volume / servingMl) * servingGrams;
    }
    return undefined;
  }
  if (unit === 'serving') {
    if (servingGrams !== undefined) return quantity * servingGrams;
    // A serving the source states only as a volume weighs through the food's own density (MM-650), never a guessed one.
    const servingMl = reference.servingMilliliters;
    const density = reference.densityGPerMl;
    return servingMl === undefined || density === undefined ? undefined : quantity * servingMl * density;
  }
  return undefined;
}
