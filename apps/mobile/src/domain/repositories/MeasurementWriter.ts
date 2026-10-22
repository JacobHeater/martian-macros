import type { CalendarDate } from '../CalendarDate';
import type { MeasurementSite } from '../measurements/MeasurementSite';

/** Writes tape measurements; one per site and calendar day (MM-156). */
export interface MeasurementWriter {
  /**
   * Sets `site`'s measurement for `date`, replacing any existing one. With
   * `readings`, the one or three readings it was taken from are kept beside it.
   */
  saveMeasurement(
    site: MeasurementSite,
    date: CalendarDate,
    valueCm: number,
    options?: { readings?: readonly number[] },
  ): Promise<void>;
}
