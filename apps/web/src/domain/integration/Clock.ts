import type { CalendarDate } from '../CalendarDate';

/**
 * The current time. Everything that depends on "today" asks a clock, so a
 * test or a demo can fix the day.
 */
export interface Clock {
  /** The user's current calendar day. */
  today(): CalendarDate;
  now(): Date;
}
