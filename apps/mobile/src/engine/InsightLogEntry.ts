import type { CalendarDate } from '../domain/CalendarDate';
import type { InsightRule } from './InsightRule';

/**
 * A record that an insight from `rule` was shown, and when it was dismissed
 * (MM-141). The rationing reads these.
 */
export interface InsightLogEntry {
  readonly rule: InsightRule;
  readonly shownOn: CalendarDate;
  readonly dismissedOn?: CalendarDate | undefined;
}
