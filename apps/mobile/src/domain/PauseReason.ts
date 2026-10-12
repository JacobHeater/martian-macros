const values = ['travel', 'illness', 'injury', 'other'] as const;

/** Why coaching is paused (MM-148). */
export type PauseReason = (typeof values)[number];

export const PauseReason = { values } as const;
