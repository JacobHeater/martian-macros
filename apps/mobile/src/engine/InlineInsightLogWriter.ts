import type { InlineInsightLogEntry } from './InlineInsightLogEntry';

/** Records inline insights as they are shown (MM-363). */
export interface InlineInsightLogWriter {
  /**
   * Records `entry`, unless its kind was already recorded under its item:
   * then the first record stands, with its day and words.
   */
  recordInlineInsightShown(entry: InlineInsightLogEntry): Promise<void>;
}
