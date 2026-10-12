const values = [
  /** Same load, for more reps than last time. */
  'addReps',
  /**
   * Every set reached the top of the rep range: more load, at the bottom
   * of the range.
   */
  'addLoad',
  /** No more reps at this load for three sessions: the same again. */
  'hold',
  /** Losing fat: matching last time is the aim. */
  'match',
] as const;

/** What a suggestion for the next session is (MM-79). */
export type ProgressionKind = (typeof values)[number];

export const ProgressionKind = { values } as const;
