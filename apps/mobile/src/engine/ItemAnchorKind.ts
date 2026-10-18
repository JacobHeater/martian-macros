const values = ['foodEntry', 'exercise', 'weighIn', 'waist', 'water', 'night'] as const;

/** What kinds of item an inline insight can sit under (MM-362). */
export type ItemAnchorKind = (typeof values)[number];

export const ItemAnchorKind = { values } as const;
