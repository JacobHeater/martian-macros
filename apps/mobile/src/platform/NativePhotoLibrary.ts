import type { CapturedPhoto } from '../domain/integration/CapturedPhoto';
import type { PhotoLibrary } from '../domain/integration/PhotoLibrary';
import { bytesOfBase64 } from '../lang/bytesOfBase64';
import type { MmMealShareApi } from './MmMealShareApi';

/**
 * `PhotoLibrary` through the shell (MM-599): `MmBackup.pickPhotos`, Android's
 * Photo Picker and iOS's PHPicker, neither of which needs a permission. The
 * shell reduces each photo to about 2 megapixels before it crosses.
 */
export class NativePhotoLibrary implements PhotoLibrary {
  readonly available = true;
  private readonly api: MmMealShareApi;

  constructor(api: MmMealShareApi) {
    this.api = api;
  }

  async pick(max: number): Promise<readonly CapturedPhoto[]> {
    if (max < 1) return [];
    try {
      const { photos } = await this.api.pickPhotos({ max });
      return photos.slice(0, max).map(({ data, width, height }) => ({ jpeg: bytesOfBase64(data), width, height }));
    } catch {
      return [];
    }
  }
}
