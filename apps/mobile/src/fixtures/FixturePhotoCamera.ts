import type { CameraPreview } from '../domain/integration/CameraPreview';
import type { CapturedPhoto } from '../domain/integration/CapturedPhoto';
import type { PhotoCamera } from '../domain/integration/PhotoCamera';
import { fixturePhotoJpeg } from './fixturePhotoJpeg';

/**
 * A camera for tests and stories (MM-157): it starts unless told it has no
 * camera, and every photo is the one-pixel fixture, said to be 1200 by 1600.
 */
export class FixturePhotoCamera implements PhotoCamera {
  /** Whether a camera is there and allowed. */
  available: boolean;
  /** How many times it was started, and is running now. */
  started = 0;
  running = 0;
  /** Which way it was asked to face, each time it was asked to start. */
  readonly facings: ('user' | 'environment')[] = [];

  constructor({ available = true }: { available?: boolean } = {}) {
    this.available = available;
  }

  async start(facing: 'user' | 'environment'): Promise<CameraPreview | undefined> {
    this.facings.push(facing);
    if (!this.available) return undefined;
    this.started++;
    this.running++;
    let stopped = false;
    return {
      attach: () => undefined,
      capture: async (): Promise<CapturedPhoto> => ({ jpeg: new Uint8Array(fixturePhotoJpeg), width: 1200, height: 1600 }),
      stop: () => {
        if (stopped) return;
        stopped = true;
        this.running--;
      },
    };
  }
}
