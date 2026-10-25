import type { CalendarDate } from '../../../domain/CalendarDate';
import type { Watched } from '../../../lang/Watched';
import type { CoachAdviceGiven } from './CoachAdviceGiven';

/** Reads the coach's record of the advice it showed (MM-617). */
export interface CoachAdviceRecordReader {
  /**
   * The advice shown on `since` or later, oldest first (by day, then in the
   * order recorded), then the full list after each change.
   */
  watchAdviceGivenSince(since: CalendarDate): Watched<CoachAdviceGiven[]>;
}
