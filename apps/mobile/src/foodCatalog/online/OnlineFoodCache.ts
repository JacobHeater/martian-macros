import type { CatalogFood } from '../CatalogFood';
import type { FoodPack } from '../FoodPack';
import type { PackEntry } from '../PackEntry';

/**
 * Foods found online, kept on the phone so the next scan of the same barcode
 * needs no connection (MM-58). It answers as a pack of its own (`onlinePackId`),
 * so search, barcodes and servings work on it like on a downloaded file.
 */
export interface OnlineFoodCache extends FoodPack {
  /**
   * Keeps `entry`, replacing an earlier record of the same barcode or of the
   * same source record, and gives it back as the food the catalog now holds.
   */
  remember(entry: PackEntry): Promise<CatalogFood>;

  /** How many foods are kept. */
  count(): Promise<number>;

  /** Forgets every food kept. */
  clear(): Promise<void>;
}
