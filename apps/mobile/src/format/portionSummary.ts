import { type FoodEntry, gramsFor, millilitersFor, PortionUnit, type ReferenceNutrition } from '../domain';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { portionUnitOf } from './portionUnitOf';
import { preparationLabel } from './preparationLabel';
import { quantitySourceLabel } from './quantitySourceLabel';
import { quantityText } from './quantityText';

const whole = (value: number) => quantityText(Number(toStringAsFixed(value, 0)));

function calculatedFrom(reference: ReferenceNutrition): string {
  const kcal = whole(reference.nutrition.kcal);
  switch (reference.basis) {
    case 'per100g':
      return `calculated from ${kcal} kcal per 100 g`;
    case 'per100ml':
      return `calculated from ${kcal} kcal per 100 mL`;
    case 'perServing':
      return `calculated from ${kcal} kcal per serving`;
  }
}

/**
 * A readable line for what was eaten and how the totals came about
 * (MM-167), with the state the food was weighed in where it is known
 * (MM-151): "200 g raw", "1.5 × 1 bar (40 g), as packaged". An entry
 * logged before portions were recorded says so and invents nothing.
 */
export function portionSummary(entry: FoodEntry): string {
  const portion = entry.portion;
  if (portion === undefined) return `${quantitySourceLabel(entry.source)} · amount not recorded`;
  const { quantity, unit, reference } = portion;
  if (quantity === undefined || unit === undefined) return 'Estimated totals';
  const servingDescription = reference?.servingDescription;
  const amount =
    unit === 'serving' && servingDescription !== undefined
      ? `${quantityText(quantity)} × ${servingDescription}`
      : `${quantityText(quantity)} ${portionUnitOf(unit, quantity)}`;
  const hand = PortionUnit.isHand(unit);
  const grams = hand ? portion.impliedGrams : reference === undefined ? undefined : gramsFor(quantity, unit, reference);
  let weight = grams === undefined || PortionUnit.isWeight(unit) ? '' : ` (${whole(grams)} g)`;
  // A drink stated per 100 mL with no density has no weight to say; its volume is said instead (MM-650).
  if (grams === undefined && !hand && reference?.basis === 'per100ml' && unit !== 'milliliter') {
    const ml = millilitersFor(quantity, unit, reference);
    weight = ml === undefined ? '' : ` (${whole(ml)} mL)`;
  }
  const preparation = portion.preparation;
  let state = '';
  if (preparation === 'packaged') state = `, ${preparationLabel(preparation)}`;
  else if (preparation !== undefined) state = ` ${preparationLabel(preparation)}`;
  let how: string;
  if (hand) how = 'estimated';
  else if (portion.basis === 'enteredTotals') how = 'totals entered by you';
  else how = reference === undefined ? 'calculated' : calculatedFrom(reference);
  return `${amount}${weight}${state} · ${how}`;
}
