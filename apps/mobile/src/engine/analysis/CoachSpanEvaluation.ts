import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendSpan } from '../trends/TrendSpan';
import type { CoachFinding } from './CoachFinding';

/**
 * The coach's analysis of one span as of one day (MM-605, MM-610), as the
 * announcement log's state machine reads it: evaluated as of E (yesterday),
 * E−1 and E−2.
 */
export interface CoachSpanEvaluation {
  readonly span: TrendSpan;
  readonly asOf: CalendarDate;

  /** What the analysis said: its fixes and data-quality findings are the log's keys (by `CoachFinding.id`). */
  readonly findings: readonly CoachFinding[];

  /**
   * The span's data falls below the minimums (under 60% of its days fully
   * logged, or under 3 of its last 7): a key not found is held, never
   * resolved, since missing data never resolves a trend.
   */
  readonly held: boolean;

  /** Finding ids whose exit threshold does not hold yet, though they are not said (N1 between 50% and 65%). */
  readonly unresolved: ReadonlySet<string>;
}
