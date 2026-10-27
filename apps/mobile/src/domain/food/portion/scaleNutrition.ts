import type { HandSize } from '../hand/HandSize';
import type { NutritionTotals } from './NutritionTotals';
import type { PortionUnit } from './PortionUnit';
import { referenceAmounts } from './referenceAmounts';
import type { ReferenceNutrition } from './ReferenceNutrition';

/**
 * Totals for eating `quantity` of `unit` of the food described by
 * `reference`, or undefined when the amount cannot be turned into the
 * reference's basis without guessing (MM-167).
 *
 * This is the one place a quantity scales nutrition. It is applied once, to
 * reference values; totals the user typed are never passed through it. The
 * multiple is `referenceAmounts`', so the extras scaled by it agree (MM-650).
 */
export function scaleNutrition(
  quantity: number,
  unit: PortionUnit,
  reference: ReferenceNutrition,
  { hand }: { hand?: HandSize | undefined } = {},
): NutritionTotals | undefined {
  const amounts = referenceAmounts(quantity, unit, reference, { hand });
  return amounts === undefined ? undefined : reference.nutrition.times(amounts);
}
