import type { BiologicalSex } from '../domain/BiologicalSex';

/**
 * How the coach plans the phases ahead (MM-36): when a phase ends and what
 * it reads. Each figure is a row in the evidence register; all judgement.
 * A lean gain's end is MM-129's (`LeanGainRule.stopBodyFatPercent`,
 * `LeanGainRule.stopWeeks`).
 */
export const PhaseRule = {
  /** A cut ends, and maintenance is recommended, after this many whole weeks of unbroken deficit. */
  longestCutWeeks: 16,

  /**
   * A goal under the soft floor of `SafetyBounds.checkGoalBodyFat` is held
   * this many weeks at most once reached, then a lean gain is recommended:
   * the time limit the floor's warning carries (MM-28).
   */
  lowGoalHoldWeeks: 4,

  /**
   * A pace is projected only when the trend's slope is this many of its
   * own standard deviations from flat, in the phase's direction.
   */
  steadyPaceSigmas: 2,

  /**
   * The body fat a cut aims for when no goal is set: the line under which
   * the starting recommendation is a lean gain (MM-12, `recommendMode`).
   */
  cutGoalPercent(sex: BiologicalSex): number {
    return sex === 'male' ? 15 : 23;
  },
} as const;
