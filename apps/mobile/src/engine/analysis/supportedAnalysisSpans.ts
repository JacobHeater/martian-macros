import type { CalendarDate } from '../../domain/CalendarDate';
import { TrendRule } from '../trends/TrendRule';
import { TrendSpan } from '../trends/TrendSpan';
import type { AnalysisSpan } from './AnalysisSpan';

/**
 * The spans the Coach tab's switcher offers (MM-610): 1d always, and each
 * of 7d, 2w, 1m and 3m once the days since the first entry reach it and its
 * days, through yesterday, meet MM-605's coverage rule (at least 60% fully
 * logged). `wholeDays` are the fully logged days, by epoch day.
 */
export function supportedAnalysisSpans({
  firstEntryOn,
  wholeDays,
  today,
}: {
  firstEntryOn: CalendarDate | undefined;
  wholeDays: ReadonlySet<number>;
  today: CalendarDate;
}): AnalysisSpan[] {
  const spans: AnalysisSpan[] = [1];
  if (firstEntryOn === undefined) return spans;
  const since = firstEntryOn.daysUntil(today);
  for (const span of TrendSpan.values) {
    if (since < span) break;
    let whole = 0;
    for (let i = 1; i <= span; i++) if (wholeDays.has(today.addDays(-i).epochDay)) whole++;
    if (whole >= Math.ceil(TrendRule.coverageMinimum * span - 1e-9)) spans.push(span);
  }
  return spans;
}
