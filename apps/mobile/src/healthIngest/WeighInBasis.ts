const values = [
  /** The first reading of the morning, between 04:00 and 12:00. */
  'firstMorning',
  /** No morning reading: the middle value of the day's readings. */
  'medianOfDay',
] as const;

/** Why a day's imported weigh-in is the reading it is (MM-71). */
export type WeighInBasis = (typeof values)[number];

export const WeighInBasis = { values } as const;
