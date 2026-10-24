import type { FoodGroup } from '../domain/food/FoodGroup';
import type { SearchHit } from './SearchHit';

/** Finds foods by name as the user types. */
export interface CatalogSearch {
  /**
   * Foods whose name or brand starts with each word of `query`, best first:
   * at most `limit` of them (25 unless given), after skipping `offset`.
   *
   * With `group` (MM-616), only foods in that group are returned, and a
   * query with no words lists the group's foods instead of nothing, in the
   * order they are stored. A food without a group is never in one.
   */
  search(query: string, options?: { limit?: number; offset?: number; group?: FoodGroup | undefined }): Promise<SearchHit[]>;
}
