/// The thresholds of the pause rules (MM-148). Judgement: tune them here.
abstract final class PauseRule {
  /// The longest a pause may be set for, and the longest one extension may
  /// add.
  static const maximumDays = 28;

  /// A pause this long counts as a break from the deficit.
  static const deficitBreakDays = 7;

  /// More than [heavyUseDays] paused days in the last [heavyUseWindowDays]
  /// prompts one neutral question about maintenance as the goal.
  static const heavyUseDays = 56;
  static const heavyUseWindowDays = 120;
}
