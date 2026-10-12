import type { FoodItem } from './FoodItem';
import type { Outcome } from './Outcome';

/** Finds a packaged food by barcode. */
export interface FoodBarcodeLookup {
  /** The item with this GTIN-14, or `NotFound`. */
  lookup(gtin14: string): Promise<Outcome<FoodItem>>;
}
