import type { ScannedBarcode } from './ScannedBarcode';

/**
 * Something that can read a barcode with the phone's camera (MM-43). The
 * app depends on this, not on a camera plugin, so tests use a fake and the
 * plugin can be replaced. The barcode is read on the phone; nothing is
 * uploaded.
 */
export interface BarcodeScanner {
  /**
   * Opens the camera and gives the barcode it reads, or undefined when the
   * person closed it without one. It fails when the camera cannot be used
   * (permission refused, no camera).
   */
  scan(): Promise<ScannedBarcode | undefined>;
}
