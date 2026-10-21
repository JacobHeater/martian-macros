import type { Watched } from '../lang/Watched';
import type { WeighInWindow } from './WeighInWindow';

/** Reads the weigh-in window the person chose (MM-441). */
export interface WeighInWindowReader {
  /**
   * The window in force, then each change: `WeighInWindow.usual` until one
   * is chosen, and again after going back to it.
   */
  watchWeighInWindow(): Watched<WeighInWindow>;
}
