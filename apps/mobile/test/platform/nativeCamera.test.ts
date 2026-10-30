import { describe, expect, it } from 'vitest';
import type { MmScannerApi } from '../../src/platform/MmScannerApi';
import { NativeCamera } from '../../src/platform/NativeCamera';

/** MM-43, MM-44: the camera behind the scanner and the label reader. */
const api = (answers: Partial<MmScannerApi>): MmScannerApi => ({
  scan: async () => ({ cancelled: true }),
  scanCode: async () => ({ cancelled: true }),
  readLabel: async () => ({ cancelled: true }),
  ...answers,
});

describe('NativeCamera', () => {
  it('a barcode keeps its digits and how it was encoded', async () => {
    const camera = new NativeCamera(api({ scan: async () => ({ cancelled: false, digits: '03600029145', symbology: 'upcE' }) }));
    expect(await camera.scan()).toEqual({ digits: '03600029145', symbology: 'upcE' });
  });

  it('closing the camera without a barcode gives nothing', async () => {
    expect(await new NativeCamera(api({})).scan()).toBeUndefined();
  });

  it('a symbology this app does not read fails the scan, not the app', async () => {
    const camera = new NativeCamera(api({ scan: async () => ({ cancelled: false, digits: '123', symbology: 'qr' }) }));
    await expect(camera.scan()).rejects.toThrow('does not read');
  });

  it('a camera that cannot be used says so', async () => {
    const camera = new NativeCamera(
      api({
        scan: async () => {
          throw new Error('Camera permission was refused.');
        },
      }),
    );
    await expect(camera.scan()).rejects.toThrow('Camera permission was refused.');
  });

  it('the label text comes back as read, and cancelling gives nothing', async () => {
    const camera = new NativeCamera(api({ readLabel: async () => ({ cancelled: false, text: 'Calories 140' }) }));
    expect(await camera.readLabel()).toBe('Calories 140');
    expect(await new NativeCamera(api({})).readLabel()).toBeUndefined();
  });
});
