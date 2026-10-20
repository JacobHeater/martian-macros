/**
 * How the menstrual cycle widens the scale's noise (MM-19, MM-20): judgement
 * informed by reported premenstrual water retention. Tune here.
 */
export const CycleRule = {
  /** Days before a menses start the window opens. */
  daysBefore: 5,
  /** Days after it the window closes. */
  daysAfter: 2,
  /** How much wider the reading noise is inside the window. */
  multiplier: 1.6,
} as const;
