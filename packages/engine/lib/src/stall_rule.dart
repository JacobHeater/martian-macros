/// The thresholds of the stall diagnosis (MM-140). Judgement informed by the
/// trend filter's own uncertainty, not trial data: tune them here.
abstract final class StallRule {
  /// Days of trend a stall is judged over.
  static const windowDays = 21;

  /// The window for a female profile without cycle data, so that one whole
  /// cycle is always inside it.
  static const windowDaysWithoutCycleData = 28;

  /// Progress slower than this share of the intended pace is a stall.
  static const paceFraction = 1 / 3;

  /// Not assessed within this many days of a lasting weight event.
  static const lastingEventDays = 14;

  /// A passing event this recent can be hiding fat loss behind water.
  static const maskingEventDays = 10;

  static const minimumFoodDays = 12;
  static const minimumWeighIns = 10;

  /// A waist change must exceed this to count as more than its noise. A
  /// stand-in until measurement noise is modelled (MM-155).
  static const waistNoiseCm = 1.5;
  static const minimumWaistReadings = 3;

  /// Below this multiple of resting energy an estimate often means food is
  /// missing from the log.
  static const lowEstimateRestingMultiple = 1.3;
}
