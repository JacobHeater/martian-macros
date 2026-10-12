import { registerPlugin } from '@capacitor/core';
import type { MmScannerApi } from './MmScannerApi';

/** The native camera plugin, which answers only inside the native shell. */
export const mmScanner = registerPlugin<MmScannerApi>('MmScanner');
