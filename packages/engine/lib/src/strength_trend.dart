import 'package:mm_domain/mm_domain.dart';

import 'strength_point.dart';

/// Session points in chronological order, including lifts with no usable sets.
final class StrengthTrend {
  const StrengthTrend({
    required this.exercise,
    required this.points,
    required this.loggedSessions,
    required this.recentSessions,
  });

  final Exercise exercise;
  final List<StrengthPoint> points;
  final int loggedSessions;
  final int recentSessions;

  /// Comparison ending at the latest recorded session, not an invented value
  /// for today. A baseline needs a point within the preceding seven days.
  double? changeOverDays(int days) {
    if (days <= 0) throw ArgumentError.value(days, 'days', 'Must be positive.');
    if (points.isEmpty) return null;
    final target = points.last.date.addDays(-days);
    StrengthPoint? baseline;
    for (final point in points) {
      if (!point.date.isAfter(target)) baseline = point;
    }
    if (baseline == null || baseline.date.daysUntil(target) > 7) return null;
    return points.last.trendKg - baseline.trendKg;
  }
}
