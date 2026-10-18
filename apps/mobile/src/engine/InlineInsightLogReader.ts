import type { CalendarDate } from '../domain/CalendarDate';
import type { Watched } from '../lang/Watched';
import type { InlineInsightLogEntry } from './InlineInsightLogEntry';

/** Reads which inline insights have been shown (MM-363). */
export interface InlineInsightLogReader {
  /** Those first shown on `since` or later, oldest first, then the list after each change. */
  watchInlineInsightLog({ since }: { since: CalendarDate }): Watched<InlineInsightLogEntry[]>;
}
