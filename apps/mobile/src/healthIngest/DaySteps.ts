/** One day's steps as the health platform totals them (MM-442). */
export interface DaySteps {
  /** Midnight, local time, at the start of the day. */
  readonly day: Date;

  /** A whole number above zero: a day with no steps is not given. */
  readonly steps: number;
}
