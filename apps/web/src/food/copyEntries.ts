import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodEntryWriter } from '../domain/repositories/FoodEntryWriter';

/**
 * Logs each of `entries` as a new entry. The day's completeness mark is not
 * touched: a copied day still has to be confirmed (MM-47).
 */
export async function copyEntries(writer: FoodEntryWriter, entries: readonly FoodEntry[]): Promise<void> {
  for (const entry of entries) await writer.addFood(entry);
}
