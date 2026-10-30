import type { CalendarDate } from '../../CalendarDate';

/** How often a saved food was logged, and when last (MM-706): the entries logged from it. */
export interface SavedFoodUsage {
  readonly times: number;
  readonly lastDay: CalendarDate;
}
