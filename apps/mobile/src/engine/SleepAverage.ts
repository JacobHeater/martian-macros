import type { CalendarDate } from '../domain/CalendarDate';

/** The average night over a window (MM-252): hours, and how many nights it rests on. Never a score. */
export interface SleepAverage {
  /** Mean minutes asleep across the nights recorded in the window. */
  readonly averageMinutes: number;

  /** How many nights in the window were recorded. */
  readonly nights: number;

  /** The window: the first and last day a night could have ended on. */
  readonly from: CalendarDate;
  readonly to: CalendarDate;
}
