/**
 * The calorie target at each stage of `computeTargets`, so a change can be
 * explained stage by stage (MM-138).
 */
export interface TargetsTrace {
  /** Expenditure plus the pace's energy, before any limit. */
  readonly formulaKcal: number;

  /**
   * After the weekly step limit (equal to `formulaKcal` with no previous
   * targets, or when a safety rule exempts the change).
   */
  readonly limitedKcal: number;

  /** After holding a target that a safety raise lifted last week. */
  readonly heldKcal: number;

  /** After a safety raise for a too-fast loss. */
  readonly raisedKcal: number;

  /** After the calorie floor: what was issued. */
  readonly finalKcal: number;
}
