import type { NutritionTotals } from '../portion/NutritionTotals';
import type { PortionUnit } from '../portion/PortionUnit';

/**
 * The hand portions in the order to offer them for a food with `per100g`
 * (MM-46): the one the food suits first. A palm suits meat and fish, a thumb
 * fats and spreads, a cupped hand grains, fruit and vegetables. Without
 * categories the food's makeup decides: mostly fat by weight (40 g in 100 g
 * or more) is a spread, protein-rich (12 g or more, and no less than its
 * carbohydrate) is meat or fish, and anything else is a cupped hand. All
 * three are always offered; only the order changes. With no per-100 g
 * nutrition the default order stands.
 */
export function handUnitsFor(per100g?: NutritionTotals | undefined): readonly PortionUnit[] {
  if (per100g === undefined) return ['palm', 'cuppedHand', 'thumb'];
  if (per100g.fatG >= 40) return ['thumb', 'palm', 'cuppedHand'];
  if (per100g.proteinG >= 12 && per100g.proteinG >= per100g.carbsG) return ['palm', 'cuppedHand', 'thumb'];
  return ['cuppedHand', 'palm', 'thumb'];
}
