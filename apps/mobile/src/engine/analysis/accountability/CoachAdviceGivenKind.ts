const values = ['skip', 'halve', 'swap', 'taken'] as const;

/**
 * What the coach's record of its own advice holds (MM-617): an order about
 * a food it showed (skip, halve or swap it), or, as `taken`, that it said
 * the person took its advice to skip the food, so that is said once.
 */
export type CoachAdviceGivenKind = (typeof values)[number];

export const CoachAdviceGivenKind = { values } as const;
