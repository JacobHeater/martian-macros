import { describe, expect, it } from 'vitest';
import type { CameraPreview } from '../../src/domain/integration/CameraPreview';
import type { PhotoCamera } from '../../src/domain/integration/PhotoCamera';
import { PhotoCameraProblem } from '../../src/domain/integration/PhotoCameraProblem';

/** The preview a camera started with; fails the test when it gave a problem instead. */
async function started(camera: PhotoCamera, facing: 'user' | 'environment'): Promise<CameraPreview> {
  const result = await camera.start(facing);
  if (typeof result === 'string') throw new Error(`The camera did not start: ${result}.`);
  return result;
}

/**
 * What every `PhotoCamera` must do (MM-157): starting never throws; a
 * camera that did not start says why, as one of the problems the screen
 * words (MM-560); a camera that started is `available`, gives a preview
 * that can be attached, taken from and stopped, and stopping twice is
 * harmless. `captures` says whether this one can take a picture where the
 * test runs (a canvas is needed for the web view's).
 */
export function photoCameraContract(
  name: string,
  create: () => PhotoCamera,
  { available, captures }: { available: boolean; captures: boolean },
): void {
  describe(`${name} as PhotoCamera`, () => {
    it.each(['user', 'environment'] as const)(`facing %s, ${available ? 'starts' : 'says why it gives no camera, without throwing'}`, async (facing) => {
      const result = await create().start(facing);
      if (!available) {
        expect(PhotoCameraProblem.values).toContain(result);
        return;
      }
      expect(typeof result).toBe('object');
      const preview = result as CameraPreview;
      expect(typeof preview.attach).toBe('function');
      expect(typeof preview.capture).toBe('function');
      preview.stop();
    });

    if (available) {
      it('stopping twice is harmless', async () => {
        const preview = await started(create(), 'environment');
        preview.stop();
        expect(() => preview.stop()).not.toThrow();
      });
    }

    if (available && captures) {
      it('a picture taken is a JPEG with its size', async () => {
        const preview = await started(create(), 'environment');
        const photo = await preview.capture();
        expect([...photo.jpeg.subarray(0, 2)]).toEqual([0xff, 0xd8]);
        expect(photo.width).toBeGreaterThan(0);
        expect(photo.height).toBeGreaterThan(0);
        preview.stop();
      });
    }
  });
}
