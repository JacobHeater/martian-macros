import 'package:mm_domain/mm_domain.dart';

import 'daily_targets.dart';
import 'tdee_status.dart';

/// Targets in force from [effectiveFrom], with the TDEE they were based on.
final class TargetsRecord {
  const TargetsRecord({
    required this.effectiveFrom,
    required this.targets,
    required this.mode,
    required this.tdeeKcal,
    required this.tdeeSigmaKcal,
    required this.tdeeStatus,
  });

  final CalendarDate effectiveFrom;
  final DailyTargets targets;
  final GoalMode mode;
  final double tdeeKcal;
  final double tdeeSigmaKcal;
  final TdeeStatus tdeeStatus;
}
