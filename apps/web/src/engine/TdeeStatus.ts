const values = [
  /** Enough data: the estimate reflects observed intake and weight change. */
  'updated',
  /**
   * Not enough usable data in the window; the prior is returned unchanged
   * and targets must be held, never guessed.
   */
  'held',
] as const;

export type TdeeStatus = (typeof values)[number];

export const TdeeStatus = { values } as const;
