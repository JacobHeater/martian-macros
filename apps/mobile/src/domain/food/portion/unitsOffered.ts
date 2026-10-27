import type { QuantitySource } from '../../QuantitySource';
import type { PortionUnit } from './PortionUnit';
import type { ReferenceNutrition } from './ReferenceNutrition';

const volumeUnits: readonly PortionUnit[] = ['cup', 'tablespoon', 'teaspoon', 'milliliter'];

/**
 * The units a person may choose under `method` for a food with `reference`
 * (MM-167), in the order to offer them. Empty means the method has no
 * quantity (an Estimate), or the food has no honest conversion for it.
 *
 * Volume units are offered for a calculated entry only when the food can
 * convert them: a density, or a serving defined in both volume and weight.
 * With no `reference` (typed totals) they are descriptive and always offered.
 * Hand portions are counts and are always offered; they carry no exact
 * conversion.
 */
export function unitsOffered(
  method: QuantitySource,
  { reference }: { reference?: ReferenceNutrition | undefined } = {},
): readonly PortionUnit[] {
  switch (method) {
    case 'weighed':
      return ['gram', 'ounce'];
    case 'labelServing':
      return ['serving'];
    case 'householdMeasure': {
      if (reference === undefined) return volumeUnits;
      // A food stated per 100 mL converts every volume exactly, fluid ounces too (MM-650).
      if (reference.basis === 'per100ml') return [...volumeUnits, 'fluidOunce'];
      const convertible =
        reference.densityGPerMl !== undefined ||
        (reference.servingMilliliters !== undefined && reference.servingGrams !== undefined);
      return convertible ? volumeUnits : [];
    }
    case 'palm':
      return ['palm'];
    case 'cuppedHand':
      return ['cuppedHand'];
    case 'thumb':
      return ['thumb'];
    case 'quickAdd':
      return [];
    case 'photoEstimate':
      return ['gram'];
  }
}
