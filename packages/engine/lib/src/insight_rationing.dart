/// How often insights may appear (MM-141). Three good insights a week is the
/// ceiling of what gets read.
abstract final class InsightRationing {
  /// The period a pattern is looked for over, and the fewest days of data.
  static const patternDays = 14;
  static const minimumBasisDays = 7;

  static const newPerDay = 1;
  static const newPerWeek = 3;

  /// A dismissed rule does not return sooner than this.
  static const quietDaysAfterDismissal = 28;
}
