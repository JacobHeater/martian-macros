import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

/// Smoothed body-weight state for one calendar day.
final class WeightTrendPoint {
  const WeightTrendPoint({
    required this.date,
    required this.levelKg,
    required this.slopeKgPerDay,
    required this.waterKg,
    required this.levelVariance,
    required this.slopeVariance,
    required this.observed,
    required this.rejected,
  });

  final CalendarDate date;

  /// Tissue weight with transient water removed.
  final double levelKg;

  /// Rate of change of [levelKg].
  final double slopeKgPerDay;

  /// Estimated transient water/gut-content offset on this day.
  final double waterKg;

  final double levelVariance;
  final double slopeVariance;

  /// Whether a weigh-in was used on this day.
  final bool observed;

  /// Whether a weigh-in on this day was discarded as an outlier
  /// (typically a unit mix-up or someone else stepping on the scale).
  final bool rejected;

  double get levelSigmaKg => math.sqrt(levelVariance);
}
