import type { WeightDisplay } from '../WeightDisplay';

/** Writes how much of the person's weight the app shows (MM-118). */
export interface WeightDisplayWriter {
  /** Undefined goes back to the default. */
  saveWeightDisplay(display: WeightDisplay | undefined): Promise<void>;

  /** Remembers that the one-time offer was answered, either way; it is never made again. */
  markWeightDisplayOffered(): Promise<void>;
}
