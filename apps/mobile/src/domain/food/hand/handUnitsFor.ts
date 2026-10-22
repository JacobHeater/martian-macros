import type { NutritionTotals } from '../portion/NutritionTotals';
import type { PortionUnit } from '../portion/PortionUnit';

/**
 * The hand portions in the order to offer them for a food with `per100g`
 * (MM-46): the one the food suits first. A palm suits meat and fish, a thumb
 * fats and spreads, a cupped hand grains, fruit, vegetables, nuts and seeds.
 * Without categories the food's makeup decides: mostly fat by weight (40 g
 * in 100 g or more) with little else (under 10 g of protein and
 * carbohydrate together) is a fat or a spread; mostly fat with more than
 * that is nuts or seeds, a cupped hand first and a thumb next (a nut butter
 * has the same makeup, so it is offered the same way); protein-rich (12 g or
 * more, and no less than its carbohydrate) is meat or fish; anything else is
 * a cupped hand. All three are always offered; only the order changes. With
 * no per-100 g nutrition the default order stands.
 */
export function handUnitsFor(per100g?: NutritionTotals | undefined): readonly PortionUnit[] {
  if (per100g === undefined) return ['palm', 'cuppedHand', 'thumb'];
  if (per100g.fatG >= 40) {
    return per100g.proteinG + per100g.carbsG < 10 ? ['thumb', 'palm', 'cuppedHand'] : ['cuppedHand', 'thumb', 'palm'];
  }
  if (per100g.proteinG >= 12 && per100g.proteinG >= per100g.carbsG) return ['palm', 'cuppedHand', 'thumb'];
  return ['cuppedHand', 'palm', 'thumb'];
}
