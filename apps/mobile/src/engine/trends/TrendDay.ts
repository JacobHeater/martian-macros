import type { CalendarDate } from '../../domain/CalendarDate';
import type { TrendIneligibleReason } from './TrendIneligibleReason';

/**
 * One calendar day of a signal's daily series (MM-605). A day that is not
 * eligible says why; a day missing from a series is read as unlogged.
 */
export interface TrendDay {
  readonly date: CalendarDate;

  /** The day's value in the signal's unit, or undefined when nothing was logged. */
  readonly value: number | undefined;

  readonly eligible: boolean;

  /** Why the day does not count; undefined when it does. */
  readonly reason: TrendIneligibleReason | undefined;

  /** The day's target in the signal's unit, for the level-against-target claims (D1, D4a). */
  readonly target?: number | undefined;

  /** Relative uncertainty of the value (`IntakeDay.relativeSigma`), which floors the spread. */
  readonly relativeSigma?: number | undefined;

  /** Share of the value from estimated entries (`IntakeDay.estimatedShare`), 0–1. */
  readonly estimatedShare?: number | undefined;

  /** A planned Refeed or Day off (MM-611): eligible, and counted in the evidence. */
  readonly planned?: boolean | undefined;
}
