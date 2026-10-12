import type { CatalogFood } from './CatalogFood';

/** Finds the raw or cooked counterpart of a food (MM-151). */
export interface CatalogPairLookup {
  /**
   * The food `food` is paired with in its own pack, or undefined when the
   * source has only one state of it.
   */
  pairOf(food: CatalogFood): Promise<CatalogFood | undefined>;
}
