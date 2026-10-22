const values = [
  /** Targets are on hold during a pause (MM-148). */
  'paused',
  /** A diet break holds targets at maintenance for its length (MM-135). */
  'onBreak',
  /** The first of two steps out of a deficit; the second comes at the check-in (MM-130). */
  'easingIn',
  /** No weigh-in recent enough to work from (`recalculationWeighInDays`). */
  'noRecentWeighIn',
  /** The current targets were issued today. */
  'issuedToday',
] as const;

/** Why targets cannot be recalculated now (MM-559). */
export type RecalculationWithheldReason = (typeof values)[number];

export const RecalculationWithheldReason = { values } as const;
