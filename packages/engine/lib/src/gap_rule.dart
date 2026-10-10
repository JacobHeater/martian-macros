/// The thresholds of the return-after-a-gap rules (MM-147). Judgement: tune
/// them here.
abstract final class GapRule {
  /// Days with nothing recorded that make a gap.
  static const minimumDays = 7;

  /// A gap this long counts as a break from the deficit.
  static const deficitBreakDays = 14;

  /// From this length the expenditure estimate restarts from the last
  /// measured value with a widened uncertainty.
  static const recalibrateDays = 28;

  /// The widened uncertainty, as a fraction of the estimate.
  static const recalibrateSigmaFraction = 0.10;

  /// A weight change across the gap beyond this fraction rescales the last
  /// measured expenditure.
  static const rescaleWeightChange = 0.05;
}
