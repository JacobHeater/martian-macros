/**
 * The thresholds of the stall diagnosis (MM-140). Judgement informed by the
 * trend filter's own uncertainty, not trial data: tune them here.
 */
export const StallRule = {
  /** Days of trend a stall is judged over. */
  windowDays: 21,

  /**
   * The window for a female profile without cycle data, so that one whole
   * cycle is always inside it.
   */
  windowDaysWithoutCycleData: 28,

  /** Progress slower than this share of the intended pace is a stall. */
  paceFraction: 1 / 3,

  /** Not assessed within this many days of a lasting weight event. */
  lastingEventDays: 14,

  /** A passing event, or the start of training, this recent can be hiding fat loss behind water. */
  maskingEventDays: 10,

  /** Training started, or started again, when no workout was finished in this many days before one. */
  trainingRestartGapDays: 28,

  minimumFoodDays: 12,
  minimumWeighIns: 10,

  /**
   * Below this multiple of resting energy an estimate often means food is
   * missing from the log.
   */
  lowEstimateRestingMultiple: 1.3,
} as const;
