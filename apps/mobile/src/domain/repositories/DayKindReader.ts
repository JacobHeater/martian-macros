import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';
import type { DayKind } from '../DayKind';

/** Reads whether a day was marked a Refeed or a Day off (MM-611). */
export interface DayKindReader {
  /** The mark for `date` ('none' if it has none), then each change. */
  watchDayKind(date: CalendarDate): Watched<DayKind>;

  /** Every marked day's mark keyed by epoch day, then each change; a day with no mark is absent. */
  watchMarkedDays(): Watched<ReadonlyMap<number, DayKind>>;
}
