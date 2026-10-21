/**
 * The thresholds of the fiber insight (MM-126). Judgement: the guide is the
 * US adequate intake; the rest has no trial behind it. Tune them here.
 */
export const FiberRule = {
  /** The fortnight's fiber must average under this share of the guide. */
  underShareOfGuide: 0.5,

  /** Shown at most once in this many days, so at most monthly. */
  quietDaysAfterShown: 30,

  /** A logged food is an example when it carries at least the guide's own density, 14 g per 1,000 kcal. */
  exampleGPerKcal: 14 / 1000,

  /** Examples are named only when there are at least this many, and never more than the most. */
  fewestExamples: 2,
  mostExamples: 3,
} as const;
