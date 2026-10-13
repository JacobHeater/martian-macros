/**
 * Body mass index at or below which no calorie deficit is planned (MM-111).
 * The WHO and CDC boundary of underweight; a convention, not a threshold of
 * harm.
 */
export const underweightBmi = 18.5;

/**
 * Body mass index below which deficits are allowed only at the gentlest
 * pace and a caution is shown (MM-111). A margin above `underweightBmi`.
 */
export const lowWeightCautionBmi = 20;

/**
 * The gentlest weekly loss, as a fraction of body weight, used in the
 * caution zone.
 */
export const lowWeightMaxLossFraction = 0.005;
