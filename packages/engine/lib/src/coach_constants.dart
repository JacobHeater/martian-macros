/// Days of logging before targets may first adapt (the calibration period).
const int calibrationDays = 14;

/// Days of weigh-ins the safety check on the pace of loss looks back over.
const int safetyRaiseLookbackDays = 14;

/// Weigh-ins, outside settling windows, needed in that look-back before the
/// pace of loss can trigger a safety raise.
const int safetyRaiseMinWeighIns = 8;

/// A loss pace counts as over the limit only if it is over by more than this
/// many of its own standard deviations.
const double safetyRaiseSigmas = 1.5;

/// The most a single check-in raises the target for a too-fast loss, kcal.
const double safetyRaiseCapKcal = 400;

/// Days between target changes.
const int checkInIntervalDays = 7;

/// Days after a change in intake level during which the scale is moved by
/// glycogen, water and gut contents, not tissue.
const int settlingDays = 10;

/// A change in calorie target larger than this share of expenditure counts
/// as a change of intake level.
const double phaseChangeFraction = 0.10;

/// How far the trend level may shift per day inside a settling window, as
/// a share of body weight, beyond ordinary tissue change.
const double settlingShiftFraction = 0.004;

/// How far the trend's slope may change per day inside a settling window,
/// as a share of body weight per day. A change of intake level is a change
/// of pace.
const double settlingSlopeShiftFraction = 0.0004;
