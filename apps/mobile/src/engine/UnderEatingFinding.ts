import type { CalendarDate } from '../domain/CalendarDate';

/**
 * What the under-eating rule saw (MM-114): the average of the days that
 * count as whole, against the lowest the app would ever suggest.
 */
export interface UnderEatingFinding {
  readonly averageKcal: number;
  readonly floorKcal: number;

  /** How many whole days the average rests on. */
  readonly days: number;

  /**
   * The whole days below the floor: the ones to mark partial if they are
   * missing food.
   */
  readonly lowDays: readonly CalendarDate[];
}
