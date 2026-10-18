/**
 * The figures of the "strength on fat loss" inline insight (MM-377), each a
 * judgement recorded in the evidence register and checked by the panel's
 * measurement role (docs/agent-runs/mm377-strength-on-fat-loss/).
 */
export const StrengthOnFatLossRule = {
  /** Whole weeks of fat-loss targets in force before the line can be said. */
  minDeficitWeeks: 6,
  /** How far below its smoothed value at the start a lift may sit and still count as held: about one effective rep. */
  heldTolerance: 0.025,
  /** How far above the start counts as gone up: two effective reps, the mirror of MM-117's 5% drop. */
  upBy: 0.05,
  /** Qualifying sessions on distinct days, from the baseline's day to the workout's. */
  minSessions: 4,
  /** The longest break between consecutive sessions of the lift: MM-77's smoothing window. */
  maxGapDays: 28,
  /** The session that stands for "the start" is the latest within this many days either side of the deficit's start. */
  baselineWithinDays: 7,
  /** Each end's smoothed value must rest on at least this many sessions. */
  minSmoothedPoints: 2,
} as const;
