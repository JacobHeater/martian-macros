import type { NewProgressPhoto } from '../photos/NewProgressPhoto';
import type { PhotoSettings } from '../photos/PhotoSettings';

/** Keeps and removes progress photos (MM-157). */
export interface ProgressPhotoWriter {
  /** Keeps `photo`, beside any other of its day and pose; gives its id. Ids are never reused. */
  savePhoto(photo: NewProgressPhoto): Promise<number>;

  /** Removes a photo; one that is not there is ignored. */
  deletePhoto(id: number): Promise<void>;

  savePhotoSettings(settings: PhotoSettings): Promise<void>;
}
