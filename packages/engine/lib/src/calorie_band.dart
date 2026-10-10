import 'dart:math' as math;

/// The zone around a calorie target that counts as "on target" (MM-123):
/// within the larger of 5% and 100 kcal, either side. Food cannot be measured
/// more finely than that, so close is as good as exact.
final class CalorieBand {
  const CalorieBand(this.targetKcal);

  static const fraction = 0.05;
  static const minimumKcal = 100.0;

  final double targetKcal;

  double get halfWidthKcal => math.max(targetKcal * fraction, minimumKcal);
  double get lowKcal => targetKcal - halfWidthKcal;
  double get highKcal => targetKcal + halfWidthKcal;

  bool contains(double kcal) => kcal >= lowKcal && kcal <= highKcal;
}
