import type { InsightSwitches } from '../InsightSwitches';

/** Writes the switches of Settings > Coach (MM-364). */
export interface InsightSwitchesWriter {
  saveInsightSwitches(switches: InsightSwitches): Promise<void>;
}
