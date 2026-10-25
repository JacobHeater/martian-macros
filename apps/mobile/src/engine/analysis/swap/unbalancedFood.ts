import { TradeRule } from '../TradeRule';

/**
 * Whether a food is "mostly fat" or "light on protein" (MM-365, MM-607),
 * so it is never offered in another's place: `TradeRule.mostlyFatShare` of
 * its calories from fat on `mostlyFatMinKcal` or more, unless a protein food;
 * or under `lightOnProteinShare` from protein on `lightOnProteinMinKcal` or more.
 */
export function unbalancedFood(food: { readonly kcal: number; readonly proteinG: number; readonly fatG: number }): boolean {
  if (!(food.kcal > 0)) return false;
  const proteinShare = (4 * food.proteinG) / food.kcal;
  const fatShare = (9 * food.fatG) / food.kcal;
  const mostlyFat = fatShare >= TradeRule.mostlyFatShare && food.kcal >= TradeRule.mostlyFatMinKcal && proteinShare < TradeRule.proteinFoodShare;
  const lightOnProtein = proteinShare < TradeRule.lightOnProteinShare && food.kcal >= TradeRule.lightOnProteinMinKcal;
  return mostlyFat || lightOnProtein;
}
