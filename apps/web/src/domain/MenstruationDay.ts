import type { CalendarDate } from './CalendarDate';

/**
 * A day with menstrual flow recorded. Used to widen weight and BIA noise
 * around menses rather than mistaking water shifts for tissue change.
 */
export interface MenstruationDay {
  readonly date: CalendarDate;
}
