import type { CalendarDate } from '../domain/CalendarDate';
import type { AnalysisArea } from '../engine/analysis/AnalysisArea';
import type { AnalysisSpan } from '../engine/analysis/AnalysisSpan';
import type { CoachFindingSections } from '../engine/analysis/CoachFindingSections';
import type { UnjudgedArea } from '../engine/analysis/UnjudgedArea';

/** What "Coach’s feedback" shows for the span chosen (MM-610), worked out again on every change of what it reads. */
export interface CoachAnalysisView {
  readonly span: AnalysisSpan;
  /** The spans the data supports, 1d first; the switcher shows once any span beyond 1d is among them (MM-620). */
  readonly spans: readonly AnalysisSpan[];
  /** The days read: today for 1d, the last 7 days with today for 7d (MM-621), else the span through yesterday. */
  readonly from: CalendarDate;
  readonly to: CalendarDate;
  /** The span's fully logged days (`usableIntakeDays`); on 7d every day logged (MM-621); 0 on 1d. */
  readonly fullyLoggedDays: number;
  /** Nothing logged at all yet: "Log a food and the coach reads it here." */
  readonly nothingLogged: boolean;
  /** The under-eating finding holds (MM-114): the section opens by pointing to its notice. */
  readonly underEating: boolean;
  /** Whether that notice is shown above, or was put off. */
  readonly underEatingNoticeShown: boolean;
  readonly sections: CoachFindingSections;
  /** The areas this span is too short to judge ("Training · needs 4 weeks"). */
  readonly unjudged: readonly UnjudgedArea[];
  /** The areas read in this span, named when nothing stands out. */
  readonly checked: readonly AnalysisArea[];
}
