import type { CalendarDate } from '../CalendarDate';
import type { DayKind } from '../DayKind';

/** Marks a day a Refeed or a Day off, or clears its mark with 'none' (MM-611). */
export interface DayKindWriter {
  setDayKind(date: CalendarDate, kind: DayKind): Promise<void>;
}
