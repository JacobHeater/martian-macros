import type { FoodEntry } from '../domain';
import { portionText } from './portionText';

/**
 * What was eaten, in a few words, for a row in a meal (MM-564): "2 × 1
 * biscuit · 90 g", "200 g raw". How the totals came about stays in the
 * entry's editor. Undefined when the amount was not recorded.
 */
export function portionAmount(entry: FoodEntry): string | undefined {
  return portionText(entry.portion);
}
