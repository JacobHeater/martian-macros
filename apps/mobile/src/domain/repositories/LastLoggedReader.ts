import type { FoodEntry } from '../FoodEntry';

/** Reads the last time a food of the pack was logged, for a choice remembered per food (MM-151). */
export interface LastLoggedReader {
  /**
   * The most recent entry logged from any of `foodIds` of pack `packId`,
   * however long ago, or undefined when none ever was.
   */
  lastLoggedFrom(packId: string, foodIds: readonly number[]): Promise<FoodEntry | undefined>;
}
