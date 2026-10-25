import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendAspect } from './TrendAspect';
import type { TrendFinding } from './TrendFinding';
import type { TrendReadingStatus } from './TrendReadingStatus';

/** One key's reading as of a day, which the state machine compares across E, E−1 and E−2 (MM-605). */
export interface TrendReading {
  readonly key: string;
  readonly signal: string;
  readonly aspect: TrendAspect;
  readonly asOf: CalendarDate;
  readonly status: TrendReadingStatus;

  /** The key's finding, when one passed both gates; silent findings are quiet. */
  readonly finding: TrendFinding | undefined;

  /**
   * Whether the exit threshold holds for a trend that way: every detector of
   * the aspect is under half its entry statistic, or its effect under δ/2.
   * Never true while held.
   */
  readonly exited: { readonly up: boolean; readonly down: boolean };
}
