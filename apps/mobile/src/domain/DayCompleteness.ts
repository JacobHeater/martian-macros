const values = [
  /** User confirmed the day is fully logged. */
  'complete',
  /** User marked the day as partially logged; its intake is never used. */
  'partial',
  /** Not marked; the engine classifies it heuristically. */
  'unmarked',
] as const;

/** Whether a logged day represents everything the user ate. */
export type DayCompleteness = (typeof values)[number];

export const DayCompleteness = { values } as const;
