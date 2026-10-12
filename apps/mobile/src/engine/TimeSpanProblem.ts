const values = [
  /** The end is not after the start. */
  'endNotAfterStart',
  /** A time is before the earliest allowed (the workout's start). */
  'tooEarly',
  /** A time is after the latest allowed (the workout's end, or now). */
  'tooLate',
  /** A set conflicts with another logged set in the same workout. */
  'overlappingSet',
] as const;

/** Why a typed start and end cannot be right (MM-191). */
export type TimeSpanProblem = (typeof values)[number];

export const TimeSpanProblem = { values } as const;
