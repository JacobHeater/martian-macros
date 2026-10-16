import type { CalendarDate } from '../domain/CalendarDate';
import type { HistorySeriesKind } from './HistorySeriesKind';

/** One line on a history chart: a value for some of the days. */
export interface HistorySeries {
  readonly label: string;
  readonly values: ReadonlyMap<CalendarDate, number>;
  readonly kind: HistorySeriesKind;
  readonly dashed?: boolean;
  /** Joins the recorded points across days with none, for things measured now and then. */
  readonly connectRecordedPoints?: boolean;
  /** With `connectRecordedPoints`: points further apart than this many days are not joined. */
  readonly maximumGapDays?: number | undefined;
  /** A day still being logged (today): drawn as an open dot, not joined to the line as a whole day (MM-335). */
  readonly unfinished?: CalendarDate | undefined;
}
