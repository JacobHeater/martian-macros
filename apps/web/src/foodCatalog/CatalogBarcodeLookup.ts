import type { CatalogFood } from './CatalogFood';

/** Finds a food by its barcode. */
export interface CatalogBarcodeLookup {
  /** The food for a GTIN-14 (see `normalizeBarcode`), or undefined. */
  byBarcode(gtin14: string): Promise<CatalogFood | undefined>;
}
