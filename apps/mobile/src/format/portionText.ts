import { gramsFor, type Portion, PortionUnit } from '../domain';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { portionUnitOf } from './portionUnitOf';
import { preparationLabel } from './preparationLabel';
import { quantityText } from './quantityText';

const whole = (value: number) => quantityText(Number(toStringAsFixed(value, 0)));

/** A weight in grams at the end of a serving's name: " (20 g)". */
const servingWeight = /\s*\(\s*[\d.,]+\s*g\s*\)\s*$/;

/**
 * A portion in a few words (MM-564): "2 × 1 biscuit · 90 g", "200 g raw".
 * Undefined when no portion was recorded; "Estimated totals" when its
 * amount was not. A meal's row (`portionAmount`) and a trade's two sides
 * (MM-607) say it the same way.
 */
export function portionText(portion: Portion | undefined): string | undefined {
  if (portion === undefined) return undefined;
  const { quantity, unit, reference } = portion;
  if (quantity === undefined || unit === undefined) return 'Estimated totals';
  const grams = PortionUnit.isHand(unit) ? portion.impliedGrams : reference === undefined ? undefined : gramsFor(quantity, unit, reference);
  const weighed = grams !== undefined && !PortionUnit.isWeight(unit);
  // A serving named with its own weight ("1 tbsp (20 g)") says it once, at the end: "1 × 1 tbsp · 20 g".
  const servingDescription = weighed ? reference?.servingDescription?.replace(servingWeight, '') : reference?.servingDescription;
  const amount =
    unit === 'serving' && servingDescription !== undefined
      ? `${quantityText(quantity)} × ${servingDescription}`
      : `${quantityText(quantity)} ${portionUnitOf(unit, quantity)}`;
  // Raw or cooked changes what the grams mean, so it stays; "as packaged" does not.
  const preparation = portion.preparation;
  const state = preparation === undefined || preparation === 'packaged' ? '' : ` ${preparationLabel(preparation)}`;
  const weight = weighed ? ` · ${whole(grams)} g` : '';
  return `${amount}${state}${weight}`;
}
