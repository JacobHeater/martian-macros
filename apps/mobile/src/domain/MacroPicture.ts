const values = [
  /** Grams of each macro against its target. */
  'bars',
  /** Each macro's share of the day's calories. */
  'donut',
] as const;

/**
 * Which picture of the day's macros the hero shows (MM-253, rule 4): one
 * at a time, remembered per person. It changes what is displayed, never
 * what is stored.
 */
export type MacroPicture = (typeof values)[number];

export const MacroPicture = { values } as const;
