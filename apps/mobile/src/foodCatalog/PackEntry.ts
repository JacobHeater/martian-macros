import type { CatalogFood } from './CatalogFood';
import type { CatalogServing } from './CatalogServing';

/** A food with its servings and barcodes, as written into a pack. */
export interface PackEntry {
  readonly food: CatalogFood;
  readonly servings?: readonly CatalogServing[] | undefined;

  /** GTIN-14 only (see `normalizeBarcode`). */
  readonly barcodes?: readonly string[] | undefined;
}
