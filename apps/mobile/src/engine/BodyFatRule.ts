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
} as const;
