import { BarcodeSymbology } from '../domain/food/BarcodeSymbology';
import { StateError } from '../lang/StateError';
import type { BarcodeScanner } from './BarcodeScanner';
import type { CodeScanner } from './CodeScanner';
import type { LabelTextReader } from './LabelTextReader';
import type { MmScannerApi } from './MmScannerApi';
import type { ScannedBarcode } from './ScannedBarcode';

const asked = async <T>(step: () => Promise<T>): Promise<T> => {
  try {
    return await step();
  } catch (error) {
    throw new StateError(error instanceof Error ? error.message : String(error));
  }
};

/**
 * The phone's camera behind `BarcodeScanner` and `LabelTextReader` (MM-43,
 * MM-44), and `CodeScanner` for a move code (MM-695): read on the device, by ML Kit on Android and by AVFoundation and
 * Vision on iOS (MM-406), and nothing is sent anywhere.
 */
export class NativeCamera implements BarcodeScanner, CodeScanner, LabelTextReader {
  private readonly api: MmScannerApi;

  constructor(api: MmScannerApi) {
    this.api = api;
  }

  async scan(): Promise<ScannedBarcode | undefined> {
    const read = await asked(() => this.api.scan());
    if (read.cancelled) return undefined;
    const { digits, symbology } = read;
    if (digits === undefined || !(BarcodeSymbology.values as readonly string[]).includes(symbology ?? '')) {
      throw new StateError(`The scanner gave a barcode this app does not read: ${symbology ?? 'nothing'}.`);
    }
    return { digits, symbology: symbology as BarcodeSymbology };
  }

  async scanCode(): Promise<string | undefined> {
    const read = await asked(() => this.api.scanCode());
    return read.cancelled ? undefined : (read.text ?? '');
  }

  async readLabel(): Promise<string | undefined> {
    const read = await asked(() => this.api.readLabel());
    return read.cancelled ? undefined : (read.text ?? '');
  }
}
