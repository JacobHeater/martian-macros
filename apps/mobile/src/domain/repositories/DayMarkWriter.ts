import type { CalendarDate } from '../CalendarDate';
import type { DayCompleteness } from '../DayCompleteness';

/** Marks a day's log complete, partial or unmarked. */
export interface DayMarkWriter {
  setCompleteness(date: CalendarDate, completeness: DayCompleteness): Promise<void>;
}
