import type { BarcodeSymbology } from '../../src/domain/food/BarcodeSymbology';
import type { AppServices } from '../../src/state/AppServices';

/** For `renderApp`'s `change`: a camera that reads this barcode every time it is asked. */
export const scannerReading =
  (digits: string, symbology: BarcodeSymbology = 'ean13') =>
  (services: AppServices): AppServices => ({
    ...services,
    barcodeScanner: { scan: () => Promise.resolve({ digits, symbology }) },
  });
