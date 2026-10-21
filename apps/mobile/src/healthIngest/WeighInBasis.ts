const values = [
  /** The first reading in the weigh-in window: 04:00 to 12:00 unless it was moved (MM-441). */
  'firstMorning',
  /** No reading in the window: the middle value of the day's readings. */
  'medianOfDay',
] as const;

/** Why a day's imported weigh-in is the reading it is (MM-71). */
export type WeighInBasis = (typeof values)[number];

export const WeighInBasis = { values } as const;
