/**
 * The thresholds of choosing a fat-loss pace (MM-128). Each is an entry in
 * the evidence register; tune them here.
 */
export const PaceRule = {
  /**
   * The deficit never exceeds this share of estimated expenditure. A share
   * of body weight is a fixed number of calories per kilogram, while
   * expenditure per kilogram varies widely; this sees what the percentage
   * rule alone does not.
   */
  maxDeficitFractionOfExpenditure: 0.35,

  /** Faster is offered only with estimated body fat clearly this high (the cautious, lower figure; MM-132). */
  fasterBodyFatPercent: { male: 25, female: 35 } as const,

  /**
   * A model, not a measurement: about how much energy a kilogram of fat can
   * supply in a day (Alpert 2005). A deficit above it is noted as high for
   * the body fat, never enforced.
   */
  fatSupplyKcalPerKgFatMassDay: 69,
} as const;
