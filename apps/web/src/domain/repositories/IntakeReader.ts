import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';
import type { IntakeDay } from '../IntakeDay';

/** Reads the intake the engine consumes, derived from the food log. */
export interface IntakeReader {
  /**
   * One observation per day with any food logged, oldest first, from
   * `since`, then the full list after each change to the log or the marks.
   */
  watchIntakeDays(options: { since: CalendarDate }): Watched<IntakeDay[]>;
}
