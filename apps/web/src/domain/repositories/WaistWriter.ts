import type { CalendarDate } from '../CalendarDate';

/** Writes waist measurements; one per calendar day. */
export interface WaistWriter {
  /**
   * Sets the measurement for `date`, replacing any existing one. With
   * `readings`, the one or three readings it was taken from are kept
   * beside it (MM-155).
   */
  saveWaist(date: CalendarDate, waistCm: number, options?: { readings?: readonly number[] }): Promise<void>;
}
