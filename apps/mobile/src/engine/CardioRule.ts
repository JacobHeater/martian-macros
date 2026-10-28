/**
 * The figures of the coach's cardio floors and the steps stall rule
 * (MM-677, MM-678): the owner's choices of 2026-10-28, each with an
 * evidence row (`docs/evidence.md`). Tune them here.
 */
export const CardioRule = {
  /** The steps a day the coach holds a fat-loss or recomp program to, until the person sets their own. */
  stepsPerDay: 8000,

  /** The minutes of cardio a week the coach holds a fat-loss or recomp program to, until the person sets their own. */
  minutesPerWeek: 150,

  /** The last seven days need this many days with a steps total before the steps floor is judged. */
  stepsJudgedDays: 5,

  /** Holding up: at or over a floor in each of this many weeks, as T1. */
  holdingUpWeeks: 4,

  /** The holding-up lines need a span this long. */
  holdingUpDays: 28,

  /** A stall is put down to moving less when the window's steps a day fell by this share or more against the weeks before. */
  stepsDropShare: 0.2,

  /** How many weeks before the stall window the steps are compared with. */
  stepsBeforeWeeks: 4,

  /** The window and the weeks before each need this many days with a steps total for the comparison to be made. */
  stepsDropMinDays: 20,
} as const;
