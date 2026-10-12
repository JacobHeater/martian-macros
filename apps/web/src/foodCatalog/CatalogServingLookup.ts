import type { CatalogFood } from './CatalogFood';
import type { CatalogServing } from './CatalogServing';

/** Lists the portions a food comes in. */
export interface CatalogServingLookup {
  servingsOf(food: CatalogFood): Promise<CatalogServing[]>;
}
