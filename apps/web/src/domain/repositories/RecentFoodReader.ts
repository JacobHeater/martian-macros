import type { Watched } from '../../lang/Watched';
import type { FoodEntry } from '../FoodEntry';

/** Reads recently logged foods, for one-tap re-logging. */
export interface RecentFoodReader {
  /**
   * The most recently logged distinct foods (by name, ignoring case),
   * newest first, at most `limit` (20 unless given).
   */
  watchRecentFoods(options?: { limit?: number }): Watched<FoodEntry[]>;
}
