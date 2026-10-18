import type { Watched } from '../../lang/Watched';
import type { InsightSwitches } from '../InsightSwitches';

/** Reads the switches of Settings > Coach (MM-364). */
export interface InsightSwitchesReader {
  /** The switches, then each change. Everything on until one is changed. */
  watchInsightSwitches(): Watched<InsightSwitches>;
}
