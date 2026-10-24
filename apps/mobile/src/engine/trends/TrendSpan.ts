const values = [7, 14, 30, 90] as const;

/**
 * The span chosen on the Coach tab's switcher (MM-610), in calendar days
 * ending yesterday: 7d, 2w, 1m or 3m.
 */
export type TrendSpan = (typeof values)[number];

export const TrendSpan = { values } as const;
