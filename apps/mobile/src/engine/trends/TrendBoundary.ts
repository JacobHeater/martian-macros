import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendBoundaryCause } from './TrendBoundaryCause';

/** A day from which a trend's current regime must start (MM-605). */
export interface TrendBoundary {
  readonly date: CalendarDate;
  readonly cause: TrendBoundaryCause;
}
