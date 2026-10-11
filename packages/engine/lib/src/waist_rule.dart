/// How noisy a waist measurement is taken to be (MM-155). The figures are
/// judgment built on published measurement error and ordinary day-to-day
/// swings, not validated thresholds.
abstract final class WaistRule {
  /// The noise of one entry made as the app asks: the middle of three
  /// readings.
  static const medianOfThreeNoiseCm = 1.0;

  /// The noise of an entry that is a single reading.
  static const singleReadingNoiseCm = 1.5;

  /// A difference between two measurements is noisier than either: it has
  /// to exceed the noise figure times this to be called a change.
  static const differenceFactor = 1.4;

  /// How many entries are smoothed into each end of a comparison.
  static const smoothedEntries = 3;

  /// The latest entry has to be this recent for "now" to mean now, and no
  /// entry older than [recentWithinDays] is part of it.
  static const latestWithinDays = 14;
  static const recentWithinDays = 21;

  /// How far from the day being compared with an entry may be and still
  /// stand for it.
  static const baselineWithinDays = 10;
}
