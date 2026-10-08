import 'package:mm_engine/mm_engine.dart';

/// Weekly snapshot from a closed-loop run.
final class WeekResult {
  const WeekResult({
    required this.week,
    required this.targets,
    required this.tdee,
    required this.trueTdeeKcal,
    required this.trueWeightKg,
    required this.underReportFraction,
  });

  final int week;
  final DailyTargets targets;
  final TdeeEstimate tdee;
  final double trueTdeeKcal;
  final double trueWeightKg;
  final double underReportFraction;
}
