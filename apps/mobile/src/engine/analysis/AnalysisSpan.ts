import { TrendSpan } from '../trends/TrendSpan';

const values = [1, ...TrendSpan.values] as const;

/**
 * A span of the Coach tab's analysis (MM-610): 1 is today so far (MM-612);
 * the others are a `TrendSpan` ending yesterday.
 */
export type AnalysisSpan = (typeof values)[number];

export const AnalysisSpan = {
  values,

  /** The switcher's label: 1d, 7d, 2w, 1m, 3m. */
  label(span: AnalysisSpan): string {
    return span === 1 ? '1d' : span === 7 ? '7d' : span === 14 ? '2w' : span === 30 ? '1m' : '3m';
  },
} as const;
