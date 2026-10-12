import type { CatalogBarcodeLookup } from './CatalogBarcodeLookup';
import type { CatalogPairLookup } from './CatalogPairLookup';
import type { CatalogSearch } from './CatalogSearch';
import type { CatalogServingLookup } from './CatalogServingLookup';

/**
 * One installed pack: everything the app asks of it, nothing about how it is
 * stored. Callers that need less depend on the narrower interfaces.
 */
export interface FoodPack extends CatalogSearch, CatalogBarcodeLookup, CatalogServingLookup, CatalogPairLookup {
  readonly packId: string;
}
