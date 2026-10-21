const values = [
  /** The lower end of the body-fat range has reached the cut's goal. */
  'goalReached',
  /** The cut has run `PhaseRule.longestCutWeeks` of unbroken deficit. */
  'longestCut',
  /** Progress has stalled with the target already at the calorie floor (MM-140). */
  'stalledAtFloor',
  /** The upper end of the body-fat range has reached the lean gain's line. */
  'gainLine',
  /** The lean gain has run `PhaseRule.longestGainWeeks`. */
  'longestGain',
  /** Maintenance after a cut or a gain has run its weeks. */
  'holdDone',
] as const;

/** Why a phase ends (MM-36). */
export type PhaseEndReason = (typeof values)[number];

export const PhaseEndReason = { values } as const;
