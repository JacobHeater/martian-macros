import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendFinding } from './TrendFinding';
import type { TrendReading } from './TrendReading';
import type { TrendSpan } from './TrendSpan';

/** One signal evaluated over one span as of one day (MM-605). */
export interface TrendEvaluation {
  readonly signal: string;
  readonly asOf: CalendarDate;
  readonly span: TrendSpan;

  /** The span's eligible days over its calendar days. */
  readonly coverage: number;
  readonly eligibleDays: number;

  /** The share of eligible days that are estimate-heavy. */
  readonly estimateHeavyShare: number;

  /** The first day of the current regime, which the state claims (D1, D2, D5) read from. */
  readonly regimeStart: CalendarDate;

  /** One reading per key the signal has. */
  readonly readings: readonly TrendReading[];

  /** The detected findings, one per key at most, before de-duplication across signals. */
  readonly findings: readonly TrendFinding[];
}
