import type { CalendarDate } from './CalendarDate';
import type { ReminderKind } from './ReminderKind';

/**
 * A reminder due to be shown on `date` at `minuteOfDay`, local time
 * (MM-146). Two are the same reminder when all three fields are equal; see
 * `samePlannedReminder`.
 */
export interface PlannedReminder {
  readonly kind: ReminderKind;
  readonly date: CalendarDate;
  readonly minuteOfDay: number;
}
