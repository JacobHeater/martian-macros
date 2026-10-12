import type { Pause } from '../Pause';

/** Writes the pauses the user has set (MM-148). */
export interface PauseWriter {
  /** Adds `pause`, or replaces the one that starts on the same day. */
  savePause(pause: Pause): Promise<void>;

  /** Removes the pause that starts on the same day as `pause`, if stored. */
  deletePause(pause: Pause): Promise<void>;
}
