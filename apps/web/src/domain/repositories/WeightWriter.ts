import type { CalendarDate } from '../CalendarDate';

/** Writes weigh-ins; one per calendar day. */
export interface WeightWriter {
  /** Sets the weigh-in for `date`, replacing any existing one. */
  saveWeight(date: CalendarDate, weightKg: number): Promise<void>;

  /** Removes the weigh-in for `date`. Does nothing if there is none. */
  deleteWeight(date: CalendarDate): Promise<void>;
}
