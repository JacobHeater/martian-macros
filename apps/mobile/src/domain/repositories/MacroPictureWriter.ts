import type { MacroPicture } from '../MacroPicture';

/** Writes which macro picture the hero shows. */
export interface MacroPictureWriter {
  saveMacroPicture(picture: MacroPicture): Promise<void>;
}
