import type { Watched } from '../lang/Watched';
import type { InsightLogEntry } from './InsightLogEntry';

/** Reads which insights have been shown and dismissed. */
export interface InsightLogReader {
  /** Oldest first, then the full list after each change. */
  watchInsightLog(): Watched<InsightLogEntry[]>;
}
