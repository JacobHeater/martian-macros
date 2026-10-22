/**
 * The photos as a whole (MM-157): for the app's own backup when the person
 * has chosen to back photos up (MM-63), and for erasing everything (MM-62).
 * They are kept apart from the rest of the data, so the database's own
 * snapshot never holds a photo.
 */
export interface ProgressPhotoArchive {
  /** How many bytes the pictures take, for the size warning. */
  totalBytes(): Promise<number>;

  /** Every photo as `encodePhotoArchive` writes them. */
  exportArchive(): Promise<Uint8Array>;

  /** Replaces every photo with those in `archive`; the choices are kept. */
  restoreArchive(archive: Uint8Array): Promise<void>;

  /** Removes every photo and every choice. */
  eraseAll(): Promise<void>;
}
