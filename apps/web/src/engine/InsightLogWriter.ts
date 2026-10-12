import type { CalendarDate } from '../domain/CalendarDate';
import type { InsightRule } from './InsightRule';

/** Records insights as they are shown and dismissed. */
export interface InsightLogWriter {
  /** Records that an insight from `rule` was first shown on `day`. */
  recordInsightShown(rule: InsightRule, day: CalendarDate): Promise<void>;

  /** Marks the latest showing of `rule` as dismissed on `day`. */
  dismissInsight(rule: InsightRule, day: CalendarDate): Promise<void>;
}
