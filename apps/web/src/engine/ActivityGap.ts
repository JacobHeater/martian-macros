import type { CalendarDate } from '../domain/CalendarDate';

/** A run of days with no weigh-in and no food logged (MM-147). */
export class ActivityGap {
  /** The first and last day with nothing recorded. */
  readonly from: CalendarDate;
  readonly to: CalendarDate;

  constructor(init: { from: CalendarDate; to: CalendarDate }) {
    this.from = init.from;
    this.to = init.to;
  }

  get days(): number {
    return this.from.daysUntil(this.to) + 1;
  }

  /** The first day back. */
  get returnOn(): CalendarDate {
    return this.to.addDays(1);
  }
}
