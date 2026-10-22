const values = ['everything', 'trendOnly', 'hidden'] as const;

/**
 * How much of the person's weight the app shows (MM-118). Everything: as
 * always. Trend only: no raw reading anywhere, the trend and its change
 * only. Hidden: no weight figure anywhere; progress is said in words. The
 * coach uses every reading in every mode.
 */
export type WeightDisplay = (typeof values)[number];

export const WeightDisplay = { values } as const;
