const values = ['fatLoss', 'recomp', 'leanGain', 'maintenance'] as const;

/** The coaching phase the user is in. */
export type GoalMode = (typeof values)[number];

export const GoalMode = { values } as const;
