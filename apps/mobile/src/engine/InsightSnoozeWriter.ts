import type { InsightSnooze } from './InsightSnooze';

/** Writes which inline insights are snoozed (MM-378). */
export interface InsightSnoozeWriter {
  /** Snoozes a kind on an item, replacing an earlier snooze of the same kind and item. */
  saveInsightSnooze(snooze: InsightSnooze): Promise<void>;

  /** Turns a kind back on for an item. */
  removeInsightSnooze(kind: string, subject: string): Promise<void>;
}
