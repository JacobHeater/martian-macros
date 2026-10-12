import type { Watched } from '../../lang/Watched';
import type { Pause } from '../Pause';

/** Reads the pauses the user has set (MM-148). */
export interface PauseReader {
  /** Every pause, oldest first, then the full list after each change. */
  watchPauses(): Watched<Pause[]>;
}
