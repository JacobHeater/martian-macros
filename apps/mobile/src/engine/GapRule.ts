/**
 * The thresholds of the return-after-a-gap rules (MM-147). Judgement: tune
 * them here.
 */
export const GapRule = {
  /** Days with nothing recorded that make a gap. */
  minimumDays: 7,

  /** A gap this long counts as a break from the deficit. */
  deficitBreakDays: 14,

  /**
   * From this length the expenditure estimate restarts from the last
   * measured value with a widened uncertainty.
   */
  recalibrateDays: 28,

  /** The widened uncertainty, as a fraction of the estimate. */
  recalibrateSigmaFraction: 0.1,

  /**
   * A weight change across the gap beyond this fraction rescales the last
   * measured expenditure.
   */
  rescaleWeightChange: 0.05,
} as const;
