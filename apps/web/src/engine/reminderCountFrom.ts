import type { CalendarDate } from '../domain/CalendarDate';

/**
 * The first day an unanswered reminder counts as ignored when it is turned
 * on, or kept, at `minuteNow` on `today` (MM-146): today while its time is
 * still ahead, otherwise tomorrow. Today's was never sent.
 */
export function reminderCountFrom({
  today,
  minuteNow,
  minuteOfDay,
}: {
  today: CalendarDate;
  minuteNow: number;
  minuteOfDay: number;
}): CalendarDate {
  return minuteNow < minuteOfDay ? today : today.addDays(1);
}
