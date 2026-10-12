import type { FoodEntry } from '../FoodEntry';

/** Adds, changes and removes logged foods. */
export interface FoodEntryWriter {
  /**
   * Saves `entry` and returns its new id. Ids are never reused. The id on
   * `entry` itself is ignored.
   */
  addFood(entry: FoodEntry): Promise<number>;

  /**
   * Replaces everything about the entry with `entry`'s id: its day, meal,
   * name, macros and how it was measured. Does nothing if there is none.
   */
  updateFood(entry: FoodEntry): Promise<void>;

  /** Removes the entry with `id`. Does nothing if there is none. */
  deleteFood(id: number): Promise<void>;
}
