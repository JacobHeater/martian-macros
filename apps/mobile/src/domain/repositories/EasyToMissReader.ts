import type { Watched } from '../../lang/Watched';
import type { EasyToMissPreference } from '../food/easyToMiss/EasyToMissPreference';

/** Reads the setting for the easy-to-miss line. */
export interface EasyToMissReader {
  /** The setting, then each change. On and never shown until it changes. */
  watchEasyToMiss(): Watched<EasyToMissPreference>;
}
