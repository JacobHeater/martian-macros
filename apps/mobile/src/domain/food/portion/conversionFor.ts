import { HandModel } from '../hand/HandModel';
import type { HandSize } from '../hand/HandSize';
import type { Conversion } from './Conversion';
import { PortionUnit } from './PortionUnit';
import type { ReferenceNutrition } from './ReferenceNutrition';

/**
 * The conversion `gramsFor` uses for one `unit` of the food described by
 * `reference` (MM-167), or undefined where there is none: a weight is exact,
 * and an amount the food cannot convert without guessing has no grams at all.
 * The branches are `gramsFor`'s, so the two never disagree.
 */
export function conversionFor(
  unit: PortionUnit,
  reference: ReferenceNutrition,
  { hand }: { hand?: HandSize | undefined } = {},
): Conversion | undefined {
  const servingGrams = reference.servingGrams;
  if (servingGrams !== undefined && unit === reference.servingUnit) {
    return { kind: 'servingWeight', gramsPerUnit: servingGrams };
  }
  if (PortionUnit.isHand(unit)) {
    if (hand === undefined) return undefined;
    const each = HandModel.gramsOf(unit, hand, {
      densityGPerMl: reference.densityGPerMl,
      per100g: reference.basis === 'per100g' ? reference.nutrition : undefined,
    });
    return each === undefined ? undefined : { kind: 'handModel', gramsPerUnit: each };
  }
  if (PortionUnit.isWeight(unit)) return undefined;
  const ml = PortionUnit.milliliters(unit);
  if (ml !== undefined) {
    const density = reference.densityGPerMl;
    if (density !== undefined) return { kind: 'density', gramsPerUnit: ml * density };
    const servingMl = reference.servingMilliliters;
    if (servingMl !== undefined && servingGrams !== undefined && servingMl > 0) {
      return { kind: 'servingWeight', gramsPerUnit: (ml / servingMl) * servingGrams };
    }
    return undefined;
  }
  if (unit === 'serving') {
    if (servingGrams !== undefined) return { kind: 'servingWeight', gramsPerUnit: servingGrams };
    const servingMl = reference.servingMilliliters;
    const density = reference.densityGPerMl;
    return servingMl === undefined || density === undefined ? undefined : { kind: 'density', gramsPerUnit: servingMl * density };
  }
  return undefined;
}
