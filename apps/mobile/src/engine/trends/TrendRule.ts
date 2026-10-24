/**
 * The parameters of the trend engine (MM-605), from the measurement panel
 * (2026-10-24). Those marked uncertain are tuned so that a stationary
 * simulated user sees at most one false "new" trend in 30 days
 * (`test/engine/trendNullSimulation.test.ts`). Tune them here.
 */
export const TrendRule = {
  /** Recorded with every announcement. A change does not re-announce a continuing trend. */
  rulesVersion: 1,

  /** σ = this × the median absolute deviation: the standard deviation of a normal spread. */
  sigmaScale: 1.4826,

  /** Eligible days must be at least this share of the span's calendar days. */
  coverageMinimum: 0.6,

  /** Below this share the sentence says "on the days you logged" and strength drops a tier. */
  coverageFull: 0.8,

  /** A day is estimate-heavy when more than this share of it is estimated. */
  estimatedDayShare: 0.5,

  /** More than this share of estimate-heavy eligible days drops a tier. */
  estimateHeavyDropShare: 1 / 3,

  /** More than this share withholds size claims; the data-quality signal speaks instead. */
  estimateHeavyWithholdShare: 0.5,

  /** A change this close to a logging-style switch is data quality, not an eating change. */
  styleSwitchDays: 3,

  /** Baselines (D4b, D6) may reach this far before the span. */
  baselineLookbackDays: 28,

  /** Strong needs at least this many eligible days of evidence. */
  strongMinimumDays: 14,

  /** The span's calendar days a detector needs before it runs at all. */
  minimumSpanDays: {
    levelAgainstTarget: 7,
    drift: 21,
    shift: 12,
    longRun: 7,
    shortRun: 4,
    weekend: 21,
    weekday: 21,
    unloggedWeekday: 21,
    recentAgainstBaseline: 21,
  },

  /** D1: a one-sided sign test against the target (exact binomial, p 0.5). */
  levelAgainstTarget: { minimumDays: 7, alpha: 0.05, strongAlpha: 0.005 },

  /** D2: Theil–Sen slope with Mann–Kendall, n shrunk by lag-1 autocorrelation. */
  drift: {
    minimumRegimeDays: 21,
    minimumDays: 12,
    minimumPerThird: 3,
    /** Uncertain. */
    z: 2.33,
    /** Two-sided α 0.005. */
    strongZ: 2.81,
  },

  /** D3: the change point, scanned with prefix sums on winsorised values, recursing once. */
  shift: {
    minimumBefore: 7,
    minimumAfter: 5,
    /** Uncertain. */
    t: 3.5,
    strongMultiple: 1.5,
    winsorSigmas: 3,
    /** A shift older than this reads as a plain level claim. */
    settledDays: 28,
  },

  /** D4a: a run of days each beyond δ on one side of the target. */
  longRun: { minimumDays: 7 },

  /** D4b: a run of days each beyond the baseline median ± 1σ, its mean beyond δ. */
  shortRun: { minimumDays: 4, sigmas: 1, baselineDays: 28, baselineMinimum: 14 },

  /** D4: a run ends yesterday or the day before; one ineligible day may sit inside it. */
  run: { gapsAllowed: 1, strongDays: 8 },

  /** D5: day of week, paired within each 7-day block ending yesterday, over the last 56 days. */
  weekday: {
    windowDays: 56,
    minimumWeeks: 3,
    minimumOtherDays: 3,
    weekendAllWeeks: 3,
    weekendMostWeeks: 5,
    weekendMostShare: 0.8,
    weekdayAllWeeks: 4,
    weekdayMostOf: 6,
    weekdayMost: 5,
    unloggedOf: 4,
    unlogged: 3,
    /**
     * Logged days a week needs for its unlogged weekday to count (the
     * panel's 5). MM-614's rule keeps a random logger under MM-605's 2%: the
     * weekday must also be more than half of the unlogged days in the weeks,
     * and a day before the first log is not one of them.
     */
    unloggedMinimumLoggedDays: 5,
    strongAlpha: 0.005,
  },

  /** D6: D3's statistic at the fixed split, the last 7 days against the 28 before. */
  recentAgainstBaseline: {
    recentDays: 7,
    baselineDays: 28,
    minimumRecent: 5,
    minimumBaseline: 14,
    /**
     * Uncertain. The panel proposed 2.5; with σ read from a month of noisy
     * days and the recent week moving daily, a stationary logger passes it
     * on an estimated 2–3% of days, the largest share of the false-alarm
     * budget. Tuned to 3.0.
     */
    t: 3.0,
    strongMultiple: 1.5,
  },

  /** An aspect is held when fewer than this many of the last days are eligible. */
  heldRecentDays: 7,
  heldRecentMinimum: 3,

  /** The exit threshold: half the entry statistic, or the effect under half of δ. */
  exitShare: 0.5,
  exitEffectShare: 0.5,

  /** Evaluations in a row (as of E, E−1, ...) each transition needs. */
  newEvaluations: 2,
  reversedEvaluations: 2,
  resolvedEvaluations: 3,

  /** A continuing trend is re-announced when its effect grows by this share, or its tier rises, */
  reannounceGrowth: 0.5,
  /** and at most every so many days. Uncertain. */
  reannounceQuietDays: 14,

  /** Held goes quiet after this many days. */
  heldQuietDays: 21,

  /** The same direction within this many days of a resolution is "back again". */
  backAgainDays: 28,

  /** Ranking caps the effect at this multiple of δ. */
  maxEffectMultiple: 3,
} as const;
