import type { DataEraser } from '../domain/repositories/DataEraser';
import type { ProgressPhotoArchive } from '../domain/repositories/ProgressPhotoArchive';

/**
 * Erasing all data erases the progress photos too (MM-157, MM-62): the
 * database first, then the photos, which are kept in a file of their own.
 */
export class EraserWithPhotos implements DataEraser {
  private readonly eraser: DataEraser;
  private readonly photos: Pick<ProgressPhotoArchive, 'eraseAll'>;

  constructor({ eraser, photos }: { eraser: DataEraser; photos: Pick<ProgressPhotoArchive, 'eraseAll'> }) {
    this.eraser = eraser;
    this.photos = photos;
  }

  async eraseAll(): Promise<void> {
    await this.eraser.eraseAll();
    await this.photos.eraseAll();
  }
}
