import type { FoodEntry } from '../../FoodEntry';
import type { SavedFoodUsage } from './SavedFoodUsage';

/**
 * The usage of each saved food among `entries` (MM-706), by the food's id:
 * an entry counts when its portion came from one of the person's own foods
 * (the origin pack `custom`, MM-167). A food never logged is absent.
 */
export function savedFoodUsageOf(entries: readonly FoodEntry[]): ReadonlyMap<number, SavedFoodUsage> {
  const usage = new Map<number, SavedFoodUsage>();
  for (const entry of entries) {
    const origin = entry.portion?.origin;
    if (origin === undefined || origin.packId !== 'custom') continue;
    const before = usage.get(origin.foodId);
    usage.set(origin.foodId, {
      times: (before?.times ?? 0) + 1,
      lastDay: before === undefined || before.lastDay.epochDay < entry.date.epochDay ? entry.date : before.lastDay,
    });
  }
  return usage;
}
