/**
 * The thresholds of the sleep signal (MM-252). The six hours and the
 * fourteen nights have rows in the evidence register (Nedeltcheva 2010,
 * Tasali 2022); the minimum number of nights is judgement. Tune them here.
 */
export const SleepRule = {
  /** Nights the average is taken over: the fortnight the check-in and the insights already use. */
  windowNights: 14,

  /** Fewer recorded nights than this in the window is too few to call the average short. */
  minimumNights: 7,

  /** An average under this many hours asleep is short sleep. */
  shortSleepHours: 6,
} as const;
