import type { FoodEntry } from '../../../domain/FoodEntry';
import { foodKeyOf } from '../food/foodKeyOf';

/**
 * Whether `entry` is the food an order named by `key` (MM-617): a food of
 * that key (`foodKeyOf`), or one of a meal logged as one under that name,
 * as the orders name a logged meal (`dayUnitsOf`).
 */
export function entryIsOf(entry: FoodEntry, key: string): boolean {
  return foodKeyOf(entry) === key || entry.loggedMeal?.name.trim().toLowerCase() === key;
}
