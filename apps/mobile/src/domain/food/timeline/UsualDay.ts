/**
 * The person's usual day (MM-572): the median running total over the clock,
 * from their recent days whose foods all have a time, once there are enough.
 */
export interface UsualDay {
  /** Recent days whose foods all have a recorded time. */
  readonly timedDays: number;
  /** How many such days the usual day needs before it is drawn. */
  readonly needed: number;
  /** Minute and median total so far, every 15 minutes across the day; undefined until `timedDays` reaches `needed`. */
  readonly curve: readonly (readonly [minute: number, kcal: number])[] | undefined;
}
