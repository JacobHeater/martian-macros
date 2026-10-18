const values = ['food', 'training', 'body', 'water', 'sleep'] as const;

/** The areas inline insights come from, each switched on or off in Settings > Coach (MM-364). */
export type InsightArea = (typeof values)[number];

export const InsightArea = { values } as const;
