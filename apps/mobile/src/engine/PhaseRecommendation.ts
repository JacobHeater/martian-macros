import type { GoalMode } from '../domain/GoalMode';
import type { PhaseEndReason } from './PhaseEndReason';

/**
 * The phase the coach recommends once the current one ends (MM-36), and
 * the one after it. A recommendation: the goal is the user's to change.
 */
export interface PhaseRecommendation {
  readonly reason: PhaseEndReason;
  readonly next: GoalMode;

  /** Whole weeks `next` should run, when it is a hold at maintenance. */
  readonly nextWeeks: number | undefined;

  /** The phase after `next`, when the plan knows it; undefined otherwise. */
  readonly then: GoalMode | undefined;
}
