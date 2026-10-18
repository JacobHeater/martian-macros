/**
 * The figures of the "volume jump" inline insight (MM-366). Each is a
 * judgement recorded in the evidence register, not a threshold from a
 * study: the workload-ratio literature it resembles is contested and is
 * not cited for it (the panel's TR-4).
 */
export const VolumeJumpRule = {
  /** This week's hard sets for a group against its usual week. */
  ratio: 1.5,
  /** And at least this many more sets than usual, so 2 to 3 sets says nothing. */
  minimumMoreSets: 4,
  /** The usual week is the average of this many weeks before. */
  usualWeeks: 4,
  /** Of which at least this many had a hard set for the group, so a first block or a missed month says nothing. */
  weeksWithSets: 3,
  /** Shown on the workouts of its first week (the product owner, 2026-10-17)… */
  shownForDays: 7,
  /** …then quiet for this many days, even while it holds. */
  restDays: 28,
} as const;
