import type { CalendarDate } from '../../domain/CalendarDate';
import type { InsightPriority } from '../InsightPriority';
import type { TrendFinding } from '../trends/TrendFinding';
import type { AnalysisSpan } from './AnalysisSpan';
import type { CoachFindingKind } from './CoachFindingKind';
import type { CoachFood } from './CoachFood';
import type { CoachTrade } from './CoachTrade';

/**
 * One thing the coach's analysis found (MM-604), as figures: the words are
 * fixed templates in `format/`, chosen by `signal` and `kind`. Nothing is
 * generated.
 */
export interface CoachFinding {
  /** Stable across days while the finding holds: the trend key, or `day:<epochDay>:<signal>:<kind>` for 1d, so a 1d dismissal lasts the day. */
  readonly id: string;
  /** The catalog signal it comes from, e.g. `fatAgainstTarget` (MM-606) or `trainingDropped` (MM-609). */
  readonly signal: string;
  readonly kind: CoachFindingKind;
  readonly span: AnalysisSpan;
  readonly from: CalendarDate;
  readonly to: CalendarDate;
  readonly priority: InsightPriority;
  /** The observed numbers by name, shown in "The numbers behind this". */
  readonly figures: Readonly<Record<string, number>>;
  /** Contributing foods, at most 3. */
  readonly foods: readonly CoachFood[];
  readonly trade: CoachTrade | undefined;
  /** For a span finding, the trend it rests on (MM-605). */
  readonly trend: TrendFinding | undefined;
  /**
   * What the words name that is not a figure (MM-609): the lifts, as their
   * strength trend names them ("Deleted exercise" for one since deleted,
   * MM-348), or the muscle groups by id. Absent when nothing is named.
   */
  readonly subjects?: readonly string[] | undefined;
}
