const values = [
  /** Estimated body fat reached the line MM-12 calls high. */
  'bodyFat',
  /** The waist is up 5% or more since the gain began. */
  'waist',
  /** The gain has run 26 weeks. */
  'weeks',
] as const;

/** Why the coach recommends ending a lean gain (MM-129). The first that applies is given. */
export type LeanGainStopReason = (typeof values)[number];

export const LeanGainStopReason = { values } as const;
