import type { CapturedPhoto } from '../domain/integration/CapturedPhoto';
import type { PhotoLibrary } from '../domain/integration/PhotoLibrary';
import { fixturePhotoJpeg } from './fixturePhotoJpeg';

/** A photo picker for tests and stories (MM-599): the person chooses `chosen` photos, each the one-pixel fixture. */
export class InMemoryPhotoLibrary implements PhotoLibrary {
  available: boolean;
  /** How many photos the person chooses when it opens. */
  chosen: number;
  /** The most each opening was asked for. */
  readonly asked: number[] = [];

  constructor({ available = true, chosen = 2 }: { available?: boolean; chosen?: number } = {}) {
    this.available = available;
    this.chosen = chosen;
  }

  async pick(max: number): Promise<readonly CapturedPhoto[]> {
    this.asked.push(max);
    if (!this.available) return [];
    return Array.from({ length: Math.min(max, this.chosen) }, () => ({ jpeg: new Uint8Array(fixturePhotoJpeg), width: 1200, height: 1600 }));
  }
}
