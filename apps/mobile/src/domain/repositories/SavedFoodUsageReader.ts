import type { Watched } from '../../lang/Watched';
import type { SavedFoodUsage } from '../food/custom/SavedFoodUsage';

/** Reads how often each of the person's saved foods was logged (MM-706). */
export interface SavedFoodUsageReader {
  /**
   * The usage of every saved food ever logged from, by the food's id, then
   * again after each change to the log. A food never logged is absent.
   */
  watchSavedFoodUsage(): Watched<ReadonlyMap<number, SavedFoodUsage>>;
}
