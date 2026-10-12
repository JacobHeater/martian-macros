import { StateError } from '../lang/StateError';
import type { BarcodeScanner } from './BarcodeScanner';
import type { LabelTextReader } from './LabelTextReader';
import type { ScannedBarcode } from './ScannedBarcode';

/**
 * Where there is no camera to use: a browser, or a build without the camera
 * plugins. Scanning and label reading say so, and the digits and the
 * numbers can still be typed.
 */
export class NoCamera implements BarcodeScanner, LabelTextReader {
  scan(): Promise<ScannedBarcode | undefined> {
    return Promise.reject(new StateError('No camera is available.'));
  }

  readLabel(): Promise<string | undefined> {
    return Promise.reject(new StateError('No camera is available.'));
  }
}
