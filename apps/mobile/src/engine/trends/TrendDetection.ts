import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendDetector } from './TrendDetector';
import type { TrendDirection } from './TrendDirection';

/**
 * What one detector read toward one direction (MM-605), whether or not it
 * fired: the exit threshold reads the same figures.
 */
export interface TrendDetection {
  readonly detector: TrendDetector;
  readonly direction: TrendDirection;

  /** Both gates passed: the statistic, and an effect of at least δ that way. */
  readonly fires: boolean;

  /** The statistic passed the strong threshold (α ≤ 0.005, or 1.5× the D3/D6 threshold). */
  readonly strong: boolean;

  /** The statistic toward `direction` over its entry threshold: 1 or more passes, 0 is none. */
  readonly ratio: number;

  /** The signed effect in the signal's unit (weeks, for an unlogged weekday). */
  readonly effect: number;

  /** The evidence's size and the count that agrees ("11 of the 14 days you logged", or weeks for D5). */
  readonly n: number;
  readonly k: number;

  /** Eligible days the evidence rests on, which strong needs at least 14 of. */
  readonly days: number;

  /** The first day of the change, run or regime. */
  readonly onset: CalendarDate | undefined;

  /** D5's day: Sunday 0 to Saturday 6, or the weekend. */
  readonly weekday?: number | 'weekend' | undefined;
}
