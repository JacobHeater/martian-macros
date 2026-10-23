import type { FoodEntry } from '../../FoodEntry';
import { rankedSources } from '../rankedSources';
import type { Micronutrient } from './Micronutrient';
import type { MicronutrientSource } from './MicronutrientSource';

/**
 * The foods that add the most of `nutrient` over `entries`, one day's foods,
 * most first (MM-561). Entries with the same name are one food, their amounts
 * added. A food that states nothing or 0 adds nothing and is not listed; a
 * tie keeps the order the foods were logged in.
 */
export function topSourcesOf(entries: readonly FoodEntry[], nutrient: Micronutrient, count = 5): MicronutrientSource[] {
  return rankedSources(entries, (entry) => entry.micros.of(nutrient), (entry) => entry.name, count).map(({ entry, amount }) => ({
    name: entry.name,
    amount,
  }));
}
