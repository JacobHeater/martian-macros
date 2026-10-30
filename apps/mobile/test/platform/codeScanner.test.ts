import { expect, it } from 'vitest';
import type { MmScannerApi } from '../../src/platform/MmScannerApi';
import { NativeCamera } from '../../src/platform/NativeCamera';

/** MM-695: the move code is read through its own call; the food scanner still takes only retail barcodes. */
const api = (scan: Awaited<ReturnType<MmScannerApi['scan']>>, code?: string): MmScannerApi => ({
  scan: async () => scan,
  scanCode: async () => (code === undefined ? { cancelled: true } : { cancelled: false, text: code }),
  readLabel: async () => ({ cancelled: true }),
});

it('reads nothing from a QR code through the food scanner', async () => {
  await expect(new NativeCamera(api({ cancelled: false, digits: 'MMMOVE1:ABC', symbology: 'qr' })).scan()).rejects.toThrow();
});

it('gives a QR code’s text through the code scanner, and nothing when the camera is closed', async () => {
  expect(await new NativeCamera(api({ cancelled: true }, 'MMMOVE1:ABC')).scanCode()).toBe('MMMOVE1:ABC');
  expect(await new NativeCamera(api({ cancelled: true })).scanCode()).toBeUndefined();
});
