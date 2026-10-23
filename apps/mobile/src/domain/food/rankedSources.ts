import type { FoodEntry } from '../FoodEntry';
import type { RankedSource } from './RankedSource';

/**
 * The foods that add the most of something over `entries`, most first
 * (MM-561, MM-562). `amountOf` says what an entry adds, undefined where it
 * does not say; entries with the same `keyOf` are one food, their amounts
 * added. A food that adds nothing is not listed, and a tie keeps the order
 * the foods were logged in.
 */
export function rankedSources(
  entries: readonly FoodEntry[],
  amountOf: (entry: FoodEntry) => number | undefined,
  keyOf: (entry: FoodEntry) => string,
  count = 5,
): RankedSource[] {
  const byKey = new Map<string, { entry: FoodEntry; amount: number }>();
  for (const entry of entries) {
    const amount = amountOf(entry);
    if (amount === undefined || amount <= 0) continue;
    const key = keyOf(entry);
    const known = byKey.get(key);
    if (known === undefined) byKey.set(key, { entry, amount });
    else known.amount += amount;
  }
  return [...byKey.values()].sort((a, b) => b.amount - a.amount).slice(0, count);
}
