const values = ['contraception', 'pregnancy', 'menopause', 'notSure'] as const;

/** Why a period may be missing, as answered at the recovery check-in (MM-116). Never stored. */
export type MissedPeriodAnswer = (typeof values)[number];

export const MissedPeriodAnswer = { values } as const;
