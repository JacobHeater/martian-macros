import type { CalendarDate } from '../domain/CalendarDate';
import type { CardioSession } from '../domain/training/CardioSession';
import type { StepsDay } from '../domain/training/StepsDay';
import type { CardioWeekTotals } from './CardioWeekTotals';

/**
 * Cardio over the last seven days beside the seven before (MM-677), the
 * same rolling week as the Train screen's other facts (MM-258), with the
 * floors it is read against (MM-678).
 */
export interface CardioWeek {
  readonly today: CalendarDate;
  readonly current: CardioWeekTotals;
  readonly previous: CardioWeekTotals;
  /** The current week's sessions, newest first. */
  readonly sessions: readonly CardioSession[];
  /** The current week's steps by day, oldest first; a day with no total is left out. */
  readonly steps: readonly StepsDay[];
  /** Today's steps, when the platform has a total for today. */
  readonly stepsToday: number | undefined;
  /** The floors in force: the person's, or the coach's defaults. */
  readonly floors: { readonly stepsPerDay: number; readonly minutesPerWeek: number };
  /** Whether the wearable has ever given a session or a day of steps: until it has, nothing is judged. */
  readonly inUse: boolean;
}
