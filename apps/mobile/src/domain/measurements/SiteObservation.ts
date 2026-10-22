import type { CalendarDate } from '../CalendarDate';
import type { MeasurementSite } from './MeasurementSite';

interface SiteObservationInit {
  site: MeasurementSite;
  date: CalendarDate;
  valueCm: number;
  readings?: readonly number[];
}

/**
 * One site's circumference on one day (MM-156), as the waist's is (MM-155):
 * the middle of three readings, or one reading for a quick entry.
 */
export class SiteObservation {
  readonly site: MeasurementSite;
  readonly date: CalendarDate;
  /** The measurement: the middle of `readings` when there are three. */
  readonly valueCm: number;
  /** The readings as taken, three or one; empty for a waist entry made before readings were kept. */
  readonly readings: readonly number[];

  constructor(init: SiteObservationInit) {
    this.site = init.site;
    this.date = init.date;
    this.valueCm = init.valueCm;
    this.readings = init.readings ?? [];
  }

  get isSingleReading(): boolean {
    return this.readings.length === 1;
  }
}
