const values = ['accepted', 'warnAndTimeLimit', 'rejected'] as const;

export type GoalBodyFatCheck = (typeof values)[number];

export const GoalBodyFatCheck = { values } as const;
