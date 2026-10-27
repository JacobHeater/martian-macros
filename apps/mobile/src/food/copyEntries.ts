import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodEntryBatchWriter } from '../domain/repositories/FoodEntryBatchWriter';

/**
 * Logs each of `entries` as a new entry, all or nothing, in one step
 * (MM-625). The day's completeness mark is not touched: a copied day still
 * has to be confirmed (MM-47).
 */
export async function copyEntries(writer: FoodEntryBatchWriter, entries: readonly FoodEntry[]): Promise<void> {
  await writer.applyFoodChanges({ add: entries });
}
