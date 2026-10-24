const values = ['food', 'training', 'strength', 'water'] as const;

/** An area the Coach tab's analysis reads (MM-610), named in "Not enough data in this span". */
export type AnalysisArea = (typeof values)[number];

export const AnalysisArea = { values } as const;
