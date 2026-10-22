/** Days of logging before targets may first adapt (the calibration period). */
export const calibrationDays = 14;

/** Days of weigh-ins the safety check on the pace of loss looks back over. */
export const safetyRaiseLookbackDays = 14;

/**
 * Weigh-ins, outside settling windows, needed in that look-back before the
 * pace of loss can trigger a safety raise.
 */
export const safetyRaiseMinWeighIns = 8;

/**
 * A loss pace counts as over the limit only if it is over by more than this
 * many of its own standard deviations.
 */
export const safetyRaiseSigmas = 1.5;

/** The most a single check-in raises the target for a too-fast loss, kcal. */
export const safetyRaiseCapKcal = 400;

/** Days between target changes. */
export const checkInIntervalDays = 7;

/**
 * Days a weigh-in stays recent enough to recalculate targets from (MM-559):
 * a recalculation works from the latest weight, so one older than this is
 * not the person's weight now.
 */
export const recalculationWeighInDays = 7;

/**
 * Days after a change in intake level during which the scale is moved by
 * glycogen, water and gut contents, not tissue.
 */
export const settlingDays = 10;

/**
 * A change in calorie target larger than this share of expenditure counts
 * as a change of intake level.
 */
export const phaseChangeFraction = 0.1;

/**
 * How far the trend level may shift per day inside a settling window, as
 * a share of body weight, beyond ordinary tissue change.
 */
export const settlingShiftFraction = 0.004;

/**
 * How far the trend's slope may change per day inside a settling window,
 * as a share of body weight per day. A change of intake level is a change
 * of pace.
 */
export const settlingSlopeShiftFraction = 0.0004;
