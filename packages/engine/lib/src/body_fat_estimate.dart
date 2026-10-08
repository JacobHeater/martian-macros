/// Body-fat percentage with a one-sigma uncertainty.
final class BodyFatEstimate {
  const BodyFatEstimate({required this.percent, required this.sigmaPercent});

  final double percent;
  final double sigmaPercent;

  /// Two-sigma bounds, clamped to a physiologically possible range.
  double get lowerPercent => (percent - 2 * sigmaPercent).clamp(2.0, 70.0);
  double get upperPercent => (percent + 2 * sigmaPercent).clamp(2.0, 70.0);

  double fatMassKg(double weightKg) => weightKg * percent / 100;

  /// Upper bound of fat-free mass. Safety floors use this so that
  /// uncertainty can never lower a floor.
  double fatFreeMassUpperKg(double weightKg) =>
      weightKg * (1 - lowerPercent / 100);
}
