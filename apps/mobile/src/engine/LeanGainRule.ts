/**
 * The figures of the lean-gain guardrails (MM-129). Each is an entry in the
 * evidence register; they are starting values to be tuned on real data.
 */
export const LeanGainRule = {
  /** The gain pace is read over this many days of trend weight. */
  fastGainWindowDays: 21,

  /**
   * The first week of a gain is left out of the pace: glycogen and water
   * arrive with the extra food and are not tissue.
   */
  fastGainSettleDays: 7,

  /** Gaining faster than this multiple of the intended pace is too fast. */
  fastGainFactor: 2,

  /** Weeks on lean gain before the waist is read against the weight. */
  fatHeavyMinWeeks: 8,

  /** Waist gained per kilogram of trend weight above which a gain looks fat-heavy. No literature: a starting value. */
  fatHeavyWaistCmPerKg: 1,

  /** Waist entries in the stretch the fat-heavy reading needs. */
  minWaistEntries: 4,

  /** Estimated body fat at which ending the gain is recommended: MM-12's "high" lines. */
  stopBodyFatPercent: { male: 20, female: 30 } as const,

  /** Waist up this share since the gain began recommends ending it. */
  stopWaistRiseFraction: 0.05,

  /** Weeks on lean gain after which ending it is recommended. */
  stopWeeks: 26,

  /** Weeks of surplus before strength is read against the weight. */
  strengthMinWeeks: 8,

  /** Trend weight up at least this share of where it began before "weight is going up" is said. */
  strengthWeightGainFraction: 0.01,

  /** A lift's smoothed estimated max up this share counts as higher: about one rep (as MM-133). */
  strengthUpFraction: 0.025,

  /** A lift is judged with this many sessions in the stretch, the latest in the last `strengthRecentDays`. */
  strengthMinSessions: 4,
  strengthRecentDays: 14,

  /** The slower gain the user may choose (MM-480): this share of the pace training status sets. */
  slowerPaceFactor: 0.5,
} as const;
