import type { CalendarDate } from '../CalendarDate';

/**
 * One day's steps as the platform totals them (MM-677, read as MM-442
 * reads them): a whole number above zero, since a day with no total has no
 * row. Context and the coach's floor only; never the expenditure estimate
 * (MM-23).
 */
export interface StepsDay {
  readonly date: CalendarDate;
  readonly steps: number;
}
