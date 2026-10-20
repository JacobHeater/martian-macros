import type { Outcome } from '../domain/integration/Outcome';
import type { PackEntry } from '../foodCatalog/PackEntry';

/**
 * A web service that knows foods (MM-58): Open Food Facts, USDA FoodData
 * Central, or a fixture. Each answer is already mapped onto the catalog's
 * shape and has passed the nutrition checks, so a caller treats it like a
 * pack's record. Only the barcode or the typed words are sent.
 */
export interface OnlineFoodSource {
  /** `off`, `fdc`: names the source in words elsewhere. */
  readonly id: string;

  /** The product with this GTIN-14, `NotFound`, or `Unavailable` when the service could not be reached. */
  byBarcode(gtin14: string): Promise<Outcome<PackEntry>>;

  /** Foods matching `query`, best first; no match is an empty success. */
  search(query: string, options?: { limit?: number }): Promise<Outcome<PackEntry[]>>;
}
