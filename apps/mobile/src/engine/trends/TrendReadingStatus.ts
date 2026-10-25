const values = ['detected', 'quiet', 'held'] as const;

/**
 * Where one key stands as of a day (MM-605): a finding of tier clear or
 * strong is detected; a silent finding or none is quiet; data below the
 * minimums is held, and holding never resolves a trend.
 */
export type TrendReadingStatus = (typeof values)[number];

export const TrendReadingStatus = { values } as const;
