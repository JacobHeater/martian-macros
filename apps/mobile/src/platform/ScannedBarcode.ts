import type { BarcodeSymbology } from '../domain/food/BarcodeSymbology';

/**
 * A barcode a scanner has read: its digits and how it was encoded, so a
 * UPC-E is expanded and not guessed (MM-54).
 */
export interface ScannedBarcode {
  readonly digits: string;
  readonly symbology: BarcodeSymbology;
}
