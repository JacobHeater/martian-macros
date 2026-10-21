import { describe, expect, it } from 'vitest';
import type { PhotoCamera } from '../../src/domain/integration/PhotoCamera';

/**
 * What every `PhotoCamera` must do (MM-157): starting never throws (no
 * camera, or one not allowed, is undefined); a camera that started is
 * `available`, gives a preview that can be attached, taken from and
 * stopped, and stopping twice is harmless. `captures` says whether this
 * one can take a picture where the test runs (a canvas is needed for the
 * web view's).
 */
export function photoCameraContract(
  name: string,
  create: () => PhotoCamera,
  { available, captures }: { available: boolean; captures: boolean },
): void {
  describe(`${name} as PhotoCamera`, () => {
    it.each(['user', 'environment'] as const)(`facing %s, ${available ? 'starts' : 'gives no camera, without throwing'}`, async (facing) => {
      const preview = await create().start(facing);
      if (!available) {
        expect(preview).toBeUndefined();
        return;
      }
      expect(preview).toBeDefined();
      expect(typeof preview?.attach).toBe('function');
      expect(typeof preview?.capture).toBe('function');
      preview?.stop();
    });

    if (available) {
      it('stopping twice is harmless', async () => {
        const preview = await create().start('environment');
        preview?.stop();
        expect(() => preview?.stop()).not.toThrow();
      });
    }

    if (available && captures) {
      it('a picture taken is a JPEG with its size', async () => {
        const preview = await create().start('environment');
        const photo = await preview!.capture();
        expect([...photo.jpeg.subarray(0, 2)]).toEqual([0xff, 0xd8]);
        expect(photo.width).toBeGreaterThan(0);
        expect(photo.height).toBeGreaterThan(0);
        preview!.stop();
      });
    }
  });
}
