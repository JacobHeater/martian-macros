import type { WeighInWindow } from './WeighInWindow';

/** Keeps the weigh-in window the person chose (MM-441). */
export interface WeighInWindowWriter {
  /** Undefined goes back to `WeighInWindow.usual`. */
  saveWeighInWindow(window: WeighInWindow | undefined): Promise<void>;
}
