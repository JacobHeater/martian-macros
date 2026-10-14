import type { Watched } from '../../lang/Watched';
import type { MacroPicture } from '../MacroPicture';

/** Reads which macro picture the hero shows. */
export interface MacroPictureReader {
  /** The choice, then each change. Bars until it changes. */
  watchMacroPicture(): Watched<MacroPicture>;
}
