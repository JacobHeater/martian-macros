/**
 * When the weekly recovery check-in asks about a missed period (MM-116).
 * Judgement: the 45 days are the ticket's; "regular" is the usual adult
 * range of cycle lengths. Tune here.
 */
export const MissedPeriodRule = {
  /** Days since the last period started from which the check-in asks. */
  askFromDays: 45,

  /** Whole cycles logged, start to start, before a cycle counts as previously regular. */
  regularCycles: 2,

  /** The shortest and longest of those cycles that count as regular, in days. */
  shortestCycleDays: 21,
  longestCycleDays: 35,
} as const;
