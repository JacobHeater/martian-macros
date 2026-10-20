/**
 * The thresholds of maintenance (MM-130): what counts as maintaining, when
 * drift is said, and how the end of a cut is handled. Judgement: tune them
 * here.
 */
export const MaintenanceRule = {
  /** Trend weight within this share of the anchor is maintaining. */
  bandFraction: 0.015,

  /** The anchor is the trend weight this many days after maintenance began, once the water has come back. */
  anchorAfterDays: 14,

  /** Outside the band for this many consecutive days, the coach asks what the user wants. */
  driftDays: 14,

  /** The temporary pace of a correction back toward the anchor, as a share of body weight a week. */
  correctionFraction: 0.0025,

  /** A correction is over once the trend is back within this share of the band's half-width. */
  correctionDoneFraction: 0.5,

  /** After a cut, about one week of maintenance per this many weeks of deficit; never fewer than the minimum. */
  deficitWeeksPerMaintenanceWeek: 4,
  minimumMaintenanceWeeks: 2,

  /** For this many days after leaving a deficit the scale's rise is explained under the weight. */
  reboundNoteDays: 14,

  /** The optional two-step way into maintenance: two equal steps, this many days apart (MM-130). */
  easeInStepDays: 7,
} as const;
