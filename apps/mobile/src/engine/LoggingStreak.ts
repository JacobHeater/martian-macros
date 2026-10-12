import type { CalendarDate } from '../domain/CalendarDate';

/**
 * How many whole days the user has logged in a row, with a missed day
 * forgiven now and then (MM-92).
 */
export interface LoggingStreak {
  /**
   * Whole days in the streak. A forgiven day is not counted and does not
   * break it.
   */
  readonly days: number;

  /** The most recent day that was missed and forgiven; undefined with none. */
  readonly forgivenOn?: CalendarDate | undefined;
}
