/**
 * When a weigh-in is far enough from the trend to deserve an explanation,
 * and what in the last two days of the person's own log counts as a likely
 * cause (MM-142). The thresholds are judgement and should be tuned; the
 * mechanisms (glycogen and water, sodium, food mass, training, the cycle,
 * alcohol, a change of phase) are well understood in direction.
 */
export const WeightJumpRule = {
  /**
   * A reading is explained when it is at least this share of the trend
   * weight away from it: one standard deviation of the trend model's
   * day-to-day water noise (MM-18), about half a kilogram at 80 kg.
   */
  noiseFraction: 0.006,

  /** How many days before the reading the log is searched: yesterday and the day before. */
  lookBackDays: 2,

  /** The days averaged for what is usual, and how many of them must be logged for an average to mean anything. */
  usualDays: 14,
  usualMinimumDays: 5,

  /** A day's carbohydrate or sodium this far from the usual day, as a share of it, is a likely cause. */
  aboveUsualFraction: 0.3,

  /** A weight event noted this many days back, today included, is a likely cause. */
  eventWithinDays: 3,

  /** How many causes are listed, the most likely first. */
  maxCauses: 3,
} as const;
