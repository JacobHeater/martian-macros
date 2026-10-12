const values = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'] as const;

/** What an exercise is done with (MM-76). */
export type Equipment = (typeof values)[number];

export const Equipment = { values } as const;
