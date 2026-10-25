import type { FoodEntry } from '../../../domain/FoodEntry';
import { FoodInsightRule } from '../../FoodInsightRule';

/**
 * Whether an entry may be named as a food in a finding (MM-606): it has
 * calories, it is not a quick-add estimate, its macros explain at least 75%
 * of its calories, and it is not a drink whose energy is mostly alcohol,
 * which is never named (a later ticket's).
 */
export function countsAsFood(entry: FoodEntry): boolean {
  if (!(entry.kcal > 0) || entry.source === 'quickAdd') return false;
  if (entry.alcoholKcal >= FoodInsightRule.alcoholShare * entry.kcal) return false;
  const explained = 4 * entry.proteinG + 4 * entry.carbsG + 9 * entry.fatG + entry.alcoholKcal;
  return explained >= FoodInsightRule.knownMacrosShare * entry.kcal;
}
