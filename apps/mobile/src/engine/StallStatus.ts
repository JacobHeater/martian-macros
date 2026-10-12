const values = ['noStall', 'notAssessed', 'stalled'] as const;

/** Whether progress has stalled against the goal (MM-140). */
export type StallStatus = (typeof values)[number];

export const StallStatus = { values } as const;
