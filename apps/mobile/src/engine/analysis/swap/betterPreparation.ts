import type { FoodTag } from '../language/FoodTag';
import { worsePreparations } from './worsePreparations';

/**
 * Whether a replacement's tags allow it as a better preparation than the
 * food's (MM-617): not fried or breaded when the food is, a diet drink for a
 * sugary drink, and never a worse preparation the food lacks. A food that is
 * sauced or creamy by nature (a lasagna) may keep its sauce: less of it is
 * preferred in the ranking (`worsePreparationCount`), not required here.
 */
export function betterPreparation(food: ReadonlySet<FoodTag>, replacement: ReadonlySet<FoodTag>): boolean {
  if ((food.has('fried') || food.has('breaded')) && (replacement.has('fried') || replacement.has('breaded'))) return false;
  if (food.has('sugaryDrink') && !replacement.has('dietDrink')) return false;
  return worsePreparations.every((tag) => food.has(tag) || !replacement.has(tag));
}
