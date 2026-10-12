const values = ['down', 'up', 'noClearChange'] as const;

/**
 * Which way a measurement went over a period, judged against its own
 * noise (MM-133, MM-155). No clear change is a result, not an absence.
 */
export type MeasuredChange = (typeof values)[number];

export const MeasuredChange = { values } as const;
