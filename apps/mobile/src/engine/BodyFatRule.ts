/**
 * How the body-fat range is drawn from the user's own measurements (MM-34).
 * Each figure has a row in the evidence register; most are judgement.
 */
export const BodyFatRule = {
  /**
   * Waist entries count toward the range only from this many days back,
   * and only once there are `minWaistEntries` of them: the middle of
   * several, so one mistyped entry moves nothing and the range changes
   * about once a week, as the entries do.
   */
  waistWindowDays: 28,
  minWaistEntries: 3,

  /**
   * The error, one standard deviation in percentage points, of the
   * waist-to-height formula (`relativeFatMass`) against a body scan.
   */
  waistFormulaSigmaPercent: 4.5,

  /**
   * How far the waist formula's error and the BMI formula's
   * (`deurenbergBodyFat`) go together. Both read the body from outside,
   * and both miss a muscular build in the same direction, so they are not
   * treated as independent.
   */
  formulaErrorCorrelation: 0.5,

  /**
   * The error, one standard deviation in percentage points, of the US Navy
   * circumference method (`navyBodyFat`) against a body scan (MM-501).
   */
  navySigmaPercent: 4,

  /**
   * How far the Navy method's error goes together with the waist formula
   * and the BMI formula already combined (MM-501). It reads the same waist
   * and the same outside shape, so its error is largely shared with theirs;
   * only the neck (and hip) it adds is new.
   */
  navyErrorCorrelation: 0.6,

  /**
   * A smart scale's readings join the range only once its own span reaches
   * this many days (MM-502): a week of readings shows the range without
   * them, never a number from the scale.
   */
  scaleSettleDays: 14,

  /**
   * A further scale's offset from the ones before it is learned from its
   * first this many days against their readings, and it joins after them,
   * so a new scale that reads higher is not read as a change in the body.
   */
  scaleOffsetDays: 7,

  /**
   * The scale readings that count are those of this many days up to the
   * week's update day: the range moves once a week, as the waist's does.
   */
  scaleWindowDays: 14,

  /** How many days with a reading the window needs before the scale counts at all. */
  minScaleDays: 4,

  /**
   * The fixed error, one standard deviation in percentage points, left in
   * a scale's level however many readings are averaged: filtering removes
   * scatter, not a scale's bias against a body scan. Consumer foot-to-foot
   * scales against DXA: limits of agreement about -14.5 to +8.6 points
   * (Bosy-Westphal 2008, Obes Facts 1:319) and about +/-9.5 points
   * (Pateyjohns 2006, Obesity 14:2064); a 95% half-width of about 9 points
   * is one sigma of about 4.5.
   */
  scaleBiasSigmaPercent: 4.5,

  /**
   * The least day-to-day scatter, one standard deviation in points, a
   * scale's readings are taken to have, however steady they look: body
   * water moves a reading even when the body does not.
   */
  scaleScatterFloorPercent: 1,

  /**
   * How far a scale's error goes together with the formulas' (from outside
   * measurements). A consumer scale's equation predicts body fat largely
   * from the same height, weight, age and sex the formulas use, with the
   * impedance adding only part of the information, so their errors are
   * shared in part. The correlation is the shared variance over the product
   * of the two sigmas: rho = s_shared^2 / (s_scale * s_outside). With the
   * shared part about 2.5 points (one sigma), s_scale 4.5 and s_outside
   * about 3.5 to 5: rho = 6.25 / (4.5 * 3.5 to 5) = 0.28 to 0.40, and the
   * upper end is taken so the range is never too narrow. Judgement.
   */
  scaleErrorCorrelation: 0.4,
} as const;
