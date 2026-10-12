import type { CalendarDate } from './CalendarDate';

/** One body-weight reading selected for its calendar day. */
export interface WeightObservation {
  readonly date: CalendarDate;
  readonly weightKg: number;

  /**
   * Platform source identifier (HealthKit source / Health Connect
   * dataOrigin); undefined for manual entry.
   */
  readonly deviceId?: string | undefined;
}
