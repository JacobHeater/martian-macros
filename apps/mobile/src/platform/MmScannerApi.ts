/**
 * The native camera plugin (MM-43, MM-44): a barcode read with the camera,
 * and the text on a photographed Nutrition Facts panel. Both are read on
 * the phone; no photo is kept and nothing is uploaded.
 */
export interface MmScannerApi {
  /** Opens the camera on a barcode. Cancelled when the person closed it. */
  scan(): Promise<{ cancelled: boolean; digits?: string; symbology?: string }>;

  /** Opens the camera on a QR code (MM-695): its text. Cancelled when the person closed it. */
  scanCode(): Promise<{ cancelled: boolean; text?: string }>;

  /** Photographs a label and gives the text read off it. */
  readLabel(): Promise<{ cancelled: boolean; text?: string }>;
}
