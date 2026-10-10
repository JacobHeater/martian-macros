/// The thresholds of the logging streak (MM-92). Judgement: tune them here.
abstract final class StreakRule {
  /// A streak tolerates one missed day in any run of this many days, and
  /// breaks on a second.
  static const forgiveWithinDays = 7;

  /// The streak is only said aloud from this many days.
  static const showFromDays = 3;
}
