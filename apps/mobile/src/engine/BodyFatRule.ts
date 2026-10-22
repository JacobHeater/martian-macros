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
   * scatter, not a scale's bias against a body scan.
   */
  scaleBiasSigmaPercent: 2,

  /**
   * The least day-to-day scatter, one standard deviation in points, a
   * scale's readings are taken to have, however steady they look: body
   * water moves a reading even when the body does not.
   */
  scaleScatterFloorPercent: 1,

  /**
   * How far a scale's error goes together with the formulas' (from outside
   * measurements). A scale reads current through the body, not its shape,
   * so they are taken as independent.
   */
  scaleErrorCorrelation: 0,
} as const;
