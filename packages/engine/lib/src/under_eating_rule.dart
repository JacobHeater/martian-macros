/// The rule constants of the under-eating notice (MM-114). Judgement, not
/// trial data: tune them here.
abstract final class UnderEatingRule {
  static const windowDays = 14;
  static const minimumDays = 7;

  /// The average must be more than this fraction below the floor.
  static const marginBelowFloor = 0.10;

  /// The notice is not repeated sooner than this after being dismissed.
  static const quietDays = 14;
}
