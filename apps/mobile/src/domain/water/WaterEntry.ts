import type { CalendarDate } from '../CalendarDate';

/** One drink of plain water (MM-313). Drinks logged as food are not water. */
export class WaterEntry {
  /** Database id; 0 for an entry not yet saved. */
  readonly id: number;
  readonly date: CalendarDate;
  readonly ml: number;

  /** When it was logged. */
  readonly at: Date;

  constructor(init: { id: number; date: CalendarDate; ml: number; at: Date }) {
    this.id = init.id;
    this.date = init.date;
    this.ml = init.ml;
    this.at = init.at;
  }
}
