/// The rules of the weekly recovery check-in (MM-116). Judgement: tune them
/// here.
abstract final class RecoveryRule {
  /// Days between check-ins, and how long a skip lasts.
  static const everyDays = 7;

  /// How many of the latest check-ins are shown as lines.
  static const shownCheckIns = 8;

  /// The lowest and highest answer.
  static const lowest = 1;
  static const highest = 5;
}
