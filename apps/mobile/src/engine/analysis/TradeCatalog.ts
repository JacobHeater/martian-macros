import type { FoodGroup } from '../../domain/food/FoodGroup';
import type { FoodOrigin } from '../../domain/food/portion/FoodOrigin';
import type { TradeCatalogFood } from './TradeCatalogFood';
import type { TradeTarget } from './TradeTarget';

/**
 * What a trade asks of the food catalog (MM-607, MM-616), answered at once:
 * the engine never imports the catalog, and an adapter reads it ahead of
 * time (`state/CatalogTradeCatalog`).
 */
export interface TradeCatalog {
  /**
   * The group of the catalog food an entry was logged from, by its origin's
   * pack and id. Undefined for a saved food (`custom`), a food found online,
   * a food the catalog no longer has, or one whose category maps to no group.
   */
  groupOf(origin: Pick<FoodOrigin, 'packId' | 'foodId'>): FoodGroup | undefined;

  /**
   * The catalog's foods in `group` whose default serving is within
   * `target`'s calories, in no particular order. Never a food without a
   * group, and never one with no calories.
   */
  candidatesIn(group: FoodGroup, target: TradeTarget): readonly TradeCatalogFood[];
}
