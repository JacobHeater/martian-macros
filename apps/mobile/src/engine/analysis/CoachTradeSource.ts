const values = ['logged', 'saved', 'catalog'] as const;

/** Where a trade's Y came from (MM-607): a food the person logs, one they saved, or the catalog. */
export type CoachTradeSource = (typeof values)[number];

export const CoachTradeSource = { values } as const;
