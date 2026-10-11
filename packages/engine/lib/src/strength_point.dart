import 'package:mm_domain/mm_domain.dart';

/// One finished session's best qualifying estimate and its smoothed value.
final class StrengthPoint {
  const StrengthPoint({
    required this.workoutId,
    required this.date,
    required this.estimateKg,
    required this.trendKg,
  });

  final int workoutId;
  final CalendarDate date;
  final double estimateKg;
  final double trendKg;
}
