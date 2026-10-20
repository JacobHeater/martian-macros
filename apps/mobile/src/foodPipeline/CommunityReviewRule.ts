/**
 * When a community record (Open Food Facts) is "Check this" rather than
 * "Label" (MM-153): it passes the energy check (MM-53, 15%) only in the
 * last third of that tolerance, it is missing fiber or sodium, or it was
 * last changed more than five years before the data it is judged against.
 * Each is a judgement with a row in the evidence register.
 */
export const CommunityReviewRule = {
  /** Energy within the check, but further than this share from what the macros imply. */
  nearToleranceFraction: 0.1,
  /** And further than this many kcal, so tiny foods are not flagged for rounding. */
  nearToleranceKcal: 20,
  /** A record older than this, against the newest record of the same data. */
  staleSeconds: 5 * 365.25 * 24 * 3600,
} as const;
