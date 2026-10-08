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
    this.explanation,
  });

  final int week;
  final DailyTargets targets;
  final TdeeEstimate tdee;
  final double trueTdeeKcal;
  final double trueWeightKg;
  final double underReportFraction;

  /// Why the targets issued this week were issued; null on weeks they did
  /// not change.
  final TargetsExplanation? explanation;
}
