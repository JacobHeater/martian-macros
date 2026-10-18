import type { Watched } from '../lang/Watched';
import type { InsightSnooze } from './InsightSnooze';

/** Reads which inline insights are snoozed (MM-378). */
export interface InsightSnoozeReader {
  /** Every snooze, those run out included, then the list after each change. */
  watchInsightSnoozes(): Watched<InsightSnooze[]>;
}
