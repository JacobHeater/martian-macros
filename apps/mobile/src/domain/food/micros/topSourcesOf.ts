import type { FoodEntry } from '../../FoodEntry';
import type { Micronutrient } from './Micronutrient';
import type { MicronutrientSource } from './MicronutrientSource';

/**
 * The foods that add the most of `nutrient` over `entries`, one day's foods,
 * most first (MM-561). Entries with the same name are one food, their amounts
 * added. A food that states nothing or 0 adds nothing and is not listed; a
 * tie keeps the order the foods were logged in.
 */
export function topSourcesOf(entries: readonly FoodEntry[], nutrient: Micronutrient, count = 5): MicronutrientSource[] {
  const byName = new Map<string, number>();
  for (const entry of entries) {
    const amount = entry.micros.of(nutrient);
    if (amount === undefined || amount <= 0) continue;
    byName.set(entry.name, (byName.get(entry.name) ?? 0) + amount);
  }
  return [...byName]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, count);
}
