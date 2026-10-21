import type { CalendarDate } from '../domain/CalendarDate';

/** A previously regular cycle with no period marked for a while: the check-in asks whether that is expected (MM-116). */
export interface MissedPeriod {
  /** The day the last marked period started. */
  readonly lastStartOn: CalendarDate;

  /** Days from then to today. */
  readonly daysSince: number;

  /** Whether "not sure" brings the notice: only on a deficit goal (fat loss or recomp). */
  readonly noticeIfNotSure: boolean;
}
