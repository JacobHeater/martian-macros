import type { SearchHit } from './SearchHit';

/** Finds foods by name as the user types. */
export interface CatalogSearch {
  /**
   * Foods whose name or brand starts with each word of `query`, best first:
   * at most `limit` of them (25 unless given), after skipping `offset`.
   */
  search(query: string, options?: { limit?: number; offset?: number }): Promise<SearchHit[]>;
}
