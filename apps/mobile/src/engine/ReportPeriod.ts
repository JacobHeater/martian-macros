import type { CalendarDate } from '../domain/CalendarDate';

/**
 * One monthly report's span of days (MM-33): 28 days from the day coaching
 * started, then 28 more, and so on.
 */
export class ReportPeriod {
  static readonly days = 28;

  /** Zero for the first report. */
  readonly index: number;

  /** The first day covered. */
  readonly from: CalendarDate;

  constructor(init: { index: number; from: CalendarDate }) {
    this.index = init.index;
    this.from = init.from;
  }

  /** The last day covered. */
  get to(): CalendarDate {
    return this.from.addDays(ReportPeriod.days - 1);
  }

  /** The first day a report on this period can be read: the day after it. */
  get readyOn(): CalendarDate {
    return this.to.addDays(1);
  }
}
