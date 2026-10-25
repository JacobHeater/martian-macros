import type { TrendSpan } from '../trends/TrendSpan';
import type { AnalysisSpan } from './AnalysisSpan';

/** The canonical span first, then the longest under it that is at most 30 days. */
const preferred: readonly TrendSpan[] = [14, 30, 7];

/**
 * The one span whose findings the announcement log follows (MM-605) and the
 * Dashboard's card shows (MM-610): 2w when the data supports it, as MM-141's
 * fortnight; else the longest supported span of at most 30 days (1m, then
 * 7d); none while only today is supported. 1d is never logged (MM-612).
 */
export function canonicalTrendSpan(supported: readonly AnalysisSpan[]): TrendSpan | undefined {
  return preferred.find((span) => supported.includes(span));
}
