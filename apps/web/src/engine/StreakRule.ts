/** The thresholds of the logging streak (MM-92). Judgement: tune them here. */
export const StreakRule = {
  /**
   * A streak tolerates one missed day in any run of this many days, and
   * breaks on a second.
   */
  forgiveWithinDays: 7,

  /** The streak is only said aloud from this many days. */
  showFromDays: 3,
} as const;
