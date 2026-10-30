/**
 * Something that reads a QR code with the phone's camera (MM-697): the move
 * code another phone shows. Only QR codes are read through it; the food
 * scanner reads only retail barcodes.
 */
export interface CodeScanner {
  /** The QR code's text, or undefined when the person closed the camera without one. Fails when the camera cannot be used. */
  scanCode(): Promise<string | undefined>;
}
