import type { Watched } from '../../lang/Watched';
import type { PhotoSettings } from '../photos/PhotoSettings';
import type { ProgressPhoto } from '../photos/ProgressPhoto';

/** Reads the progress photos kept on this phone (MM-157). */
export interface ProgressPhotoReader {
  /** Every photo, oldest first, then the list after each change. */
  watchPhotos(): Watched<ProgressPhoto[]>;

  /** The picture of photo `id` as a JPEG, or undefined when there is no such photo. */
  photoBytes(id: number): Promise<Uint8Array | undefined>;

  /** The choices about photos, then the choices after each change. */
  watchPhotoSettings(): Watched<PhotoSettings>;
}
