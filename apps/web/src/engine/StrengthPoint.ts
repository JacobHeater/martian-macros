import type { CalendarDate } from '../domain/CalendarDate';

/** One finished session's best qualifying estimate and its smoothed value. */
export interface StrengthPoint {
  readonly workoutId: number;
  readonly date: CalendarDate;
  readonly estimateKg: number;
  readonly trendKg: number;
}
