/**
 * How often insights may appear (MM-141). Three good insights a week is the
 * ceiling of what gets read.
 */
export const InsightRationing = {
  /** The period a pattern is looked for over, and the fewest days of data. */
  patternDays: 14,
  minimumBasisDays: 7,

  newPerDay: 1,
  newPerWeek: 3,

  /** A dismissed rule does not return sooner than this. */
  quietDaysAfterDismissal: 28,
} as const;
