import type { FoodEntry } from '../FoodEntry';

/**
 * Changes several logged foods as one (MM-625): a meal logged again, a slot
 * copied, a meal deleted or put back, or moved. Either every change is kept
 * or none is, and whoever watches the log is told once, so a meal appears,
 * moves or goes whole, never food by food.
 */
export interface FoodEntryBatchWriter {
  /**
   * Adds `add`, replaces `update` (by id) and removes `delete` (ids), in one
   * step, and gives the added entries' new ids in the order given. An update
   * or a delete of an entry that is not in the log fails the whole batch:
   * whatever was meant for it has gone stale, so nothing is changed.
   */
  applyFoodChanges(changes: {
    readonly add?: readonly FoodEntry[];
    readonly update?: readonly FoodEntry[];
    readonly delete?: readonly number[];
  }): Promise<number[]>;
}
