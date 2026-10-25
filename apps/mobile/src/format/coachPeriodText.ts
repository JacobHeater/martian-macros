import type { AnalysisSpan } from '../engine/analysis/AnalysisSpan';

/** MM-610's period line: "Today so far" on 1d, else "7 days through yesterday · 6 fully logged". */
export function coachPeriodText({ span, fullyLoggedDays }: { span: AnalysisSpan; fullyLoggedDays: number }): string {
  if (span === 1) return 'Today so far';
  return `${span} days through yesterday · ${fullyLoggedDays} fully logged`;
}
