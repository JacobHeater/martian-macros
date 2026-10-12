import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';
import type { DayCompleteness } from '../DayCompleteness';

/** Reads whether a day's log was marked complete or partial. */
export interface DayMarkReader {
  /** The mark for `date` (unmarked if none), then each change. */
  watchCompleteness(date: CalendarDate): Watched<DayCompleteness>;
}
