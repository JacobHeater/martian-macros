/**
 * The rule constants of the under-eating notice (MM-114). Judgement, not
 * trial data: tune them here.
 */
export const UnderEatingRule = {
  windowDays: 14,
  minimumDays: 7,

  /** The average must be more than this fraction below the floor. */
  marginBelowFloor: 0.1,

  /** The notice is not repeated sooner than this after being dismissed. */
  quietDays: 14,
} as const;
