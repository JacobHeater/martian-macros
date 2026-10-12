import type { CalendarDate } from '../CalendarDate';

/** Records that the under-eating notice was dismissed (MM-114). */
export interface UnderEatingNoticeWriter {
  saveUnderEatingDismissedOn(day: CalendarDate): Promise<void>;
}
