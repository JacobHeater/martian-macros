import type { AnalysisSpan } from '../engine/analysis/AnalysisSpan';

/** MM-610's period line: "Today so far" on 1d, "Last 7 days with today · 6 days logged" on 7d (MM-621), else "14 days through yesterday · 12 fully logged". */
export function coachPeriodText({ span, fullyLoggedDays }: { span: AnalysisSpan; fullyLoggedDays: number }): string {
  if (span === 1) return 'Today so far';
  if (span === 7) return `Last 7 days with today · ${fullyLoggedDays} ${fullyLoggedDays === 1 ? 'day' : 'days'} logged`;
  return `${span} days through yesterday · ${fullyLoggedDays} fully logged`;
}
