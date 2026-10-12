const values = ['belowFloor', 'below', 'onTarget', 'above'] as const;

/**
 * Where an intake sits against its target (MM-123, MM-149). Distance is
 * symmetric: under and over are described in the same grammar. Below the
 * calorie floor is its own case and is never "on target".
 */
export type IntakeStanding = (typeof values)[number];

export const IntakeStanding = { values } as const;
