/** The thresholds of the pause rules (MM-148). Judgement: tune them here. */
export const PauseRule = {
  /**
   * The longest a pause may be set for, and the longest one extension may
   * add.
   */
  maximumDays: 28,

  /** A pause this long counts as a break from the deficit. */
  deficitBreakDays: 7,

  /**
   * More than `heavyUseDays` paused days in the last `heavyUseWindowDays`
   * prompts one neutral question about maintenance as the goal.
   */
  heavyUseDays: 56,
  heavyUseWindowDays: 120,
} as const;
