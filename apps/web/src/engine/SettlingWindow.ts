import type { CalendarDate } from '../domain/CalendarDate';

/**
 * Days on which the scale moves for reasons that are not tissue: the
 * first days after energy intake changes level, when glycogen, the water
 * stored with it, and gut contents shift by a kilogram or two. The
 * estimator ignores weight change and intake inside the window.
 */
export class SettlingWindow {
  /** The first day at the new intake. */
  readonly start: CalendarDate;

  /** The last day left out, inclusive. */
  readonly end: CalendarDate;

  constructor(start: CalendarDate, end: CalendarDate) {
    this.start = start;
    this.end = end;
  }

  contains(day: CalendarDate): boolean {
    return !day.isBefore(this.start) && !day.isAfter(this.end);
  }
}
