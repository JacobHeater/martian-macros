import type { FoodItem } from './FoodItem';
import type { Outcome } from './Outcome';

/**
 * Finds foods by name. Implemented by the local pack, a live service, or a
 * fixture.
 */
export interface FoodSearch {
  /**
   * Items whose name or brand contains `query` (ignoring case), best first,
   * at most `limit` (25 unless given). No match is `Succeeded([])`, not
   * `NotFound`.
   */
  search(query: string, options?: { limit?: number }): Promise<Outcome<FoodItem[]>>;
}
