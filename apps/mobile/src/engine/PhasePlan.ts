import type { CalendarDate } from '../domain/CalendarDate';
import type { GoalMode } from '../domain/GoalMode';
import type { PhaseEndReason } from './PhaseEndReason';
import type { PhaseRecommendation } from './PhaseRecommendation';

/**
 * The current phase and the ones ahead (MM-36), derived from the targets
 * history and the body-fat range each time it is asked for, so nothing
 * about the plan is stored.
 */
export interface PhasePlan {
  readonly mode: GoalMode;
  readonly startedOn: CalendarDate;
  readonly weeks: number;

  /**
   * The body fat this phase runs to: the cut's goal, read against the lower
   * end of the range, or the gain's line, read against the upper end. For a
   * hold after a cut or a gain, the cut's goal, which decides what follows.
   * Undefined for a phase that has none.
   */
  readonly linePercent: number | undefined;

  /** About when the phase ends at the current pace; undefined when nothing projects it. */
  readonly projectedEndOn: CalendarDate | undefined;
  readonly projectedEndReason: PhaseEndReason | undefined;

  /** Set once the phase has ended. */
  readonly recommendation: PhaseRecommendation | undefined;
}
