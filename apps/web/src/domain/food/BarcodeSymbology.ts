const values = ['upcA', 'upcE', 'ean13', 'ean8', 'gtin14'] as const;

/**
 * How a scanned or stored barcode is encoded. UPC-E and EAN-8 are both eight
 * digits, so the scanner says which it read and the digits are never guessed.
 */
export type BarcodeSymbology = (typeof values)[number];

export const BarcodeSymbology = { values } as const;
