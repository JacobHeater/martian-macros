import type { CalendarDate } from './CalendarDate';

/** The body fat the user has set as their goal (MM-36), and the day they set it. */
export interface GoalBodyFat {
  readonly percent: number;
  readonly setOn: CalendarDate;
}
