const values = ['weight', 'waist', 'strength'] as const;

/** The three things a recomp signal is read from (MM-32). */
export type RecompMeasure = (typeof values)[number];

export const RecompMeasure = { values } as const;
