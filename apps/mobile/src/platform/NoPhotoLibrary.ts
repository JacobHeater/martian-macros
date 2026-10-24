import type { CapturedPhoto } from '../domain/integration/CapturedPhoto';
import type { PhotoLibrary } from '../domain/integration/PhotoLibrary';

/** No photo picker, as in a browser (MM-599): photos are taken with the camera, or attached in the assistant. */
export class NoPhotoLibrary implements PhotoLibrary {
  readonly available = false;

  async pick(): Promise<readonly CapturedPhoto[]> {
    return [];
  }
}
