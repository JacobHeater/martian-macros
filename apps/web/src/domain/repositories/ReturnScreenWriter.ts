import type { CalendarDate } from '../CalendarDate';

/** Records that the welcome-back screen was put off (MM-147). */
export interface ReturnScreenWriter {
  saveReturnScreenDismissedOn(day: CalendarDate): Promise<void>;
}
