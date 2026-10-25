import type { FoodTag } from '../language/FoodTag';

/** Ways of making a food the coach would swap away from: a replacement never adds one the food lacks. */
const worse: readonly FoodTag[] = ['fried', 'breaded', 'sauced', 'creamy', 'sugaryDrink'];

/**
 * Whether a replacement's tags say a better preparation than the food's
 * (MM-617): not fried or breaded when the food is, not sauced when the
 * food is, not creamy when the food is, a diet drink for a sugary drink;
 * and never one of those the food is not.
 */
export function betterPreparation(food: ReadonlySet<FoodTag>, replacement: ReadonlySet<FoodTag>): boolean {
  if ((food.has('fried') || food.has('breaded')) && (replacement.has('fried') || replacement.has('breaded'))) return false;
  if (food.has('sauced') && replacement.has('sauced')) return false;
  if (food.has('creamy') && replacement.has('creamy')) return false;
  if (food.has('sugaryDrink') && !replacement.has('dietDrink')) return false;
  return worse.every((tag) => food.has(tag) || !replacement.has(tag));
}
