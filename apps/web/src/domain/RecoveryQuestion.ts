const values = ['hunger', 'energy', 'sleep', 'training', 'mood'] as const;

/**
 * What the weekly recovery check-in asks about (MM-116). Each is answered
 * from 1, the hard end, to 5, the easy end.
 */
export type RecoveryQuestion = (typeof values)[number];

export const RecoveryQuestion = { values } as const;
