import '../../food_entry.dart';

/// What a day's entries say about fiber, and whether they say enough to show
/// a total (MM-126). An entry with no fiber value (a typed entry, a food
/// whose source did not state it) is unknown, never zero, so a total is shown
/// only when enough of the day's calories come from entries that carry one.
final class FiberDay {
  const FiberDay({required this.totalG, required this.coveredShare});

  /// Fiber from the entries that state it.
  final double totalG;

  /// The share, 0 to 1, of the day's calories from entries that carry fiber.
  final double coveredShare;

  static const minimumCoverage = 0.7;

  /// Whether [totalG] can be shown as the day's fiber.
  bool get enough => coveredShare >= minimumCoverage;

  factory FiberDay.of(Iterable<FoodEntry> entries) {
    var total = 0.0, kcal = 0.0, covered = 0.0;
    for (final e in entries) {
      kcal += e.kcal;
      final fiber = e.fiberG;
      if (fiber != null) {
        total += fiber;
        covered += e.kcal;
      }
    }
    return FiberDay(
      totalG: total,
      coveredShare: kcal <= 0 ? 0 : covered / kcal,
    );
  }
}
