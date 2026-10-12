const values = [
  'startedCreatine',
  'stoppedCreatine',
  'illness',
  'travel',
  'newTraining',
  'largeOrSaltyMeal',
  'other',
] as const;

/** A user-reported event that can move scale weight without changing tissue. */
export type WeightEventType = (typeof values)[number];

export const WeightEventType = { values } as const;
