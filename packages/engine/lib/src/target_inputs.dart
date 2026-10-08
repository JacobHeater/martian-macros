import 'package:mm_domain/mm_domain.dart';

import 'body_fat_estimate.dart';
import 'daily_targets.dart';

final class TargetInputs {
  const TargetInputs({
    required this.sex,
    required this.heightCm,
    required this.trendWeightKg,
    required this.bodyFat,
    required this.mode,
    required this.trainingStatus,
    required this.policy,
    required this.tdeeKcal,
    required this.bmrKcal,
    this.trainingKcalPerDay = 0,
    this.previous,
    this.consecutiveDeficitWeeks = 0,
    this.requestedLossFraction,
  });

  final BiologicalSex sex;
  final double heightCm;
  final double trendWeightKg;
  final BodyFatEstimate bodyFat;
  final GoalMode mode;
  final TrainingStatus trainingStatus;
  final CoachingPolicy policy;

  /// From `TdeeEstimator`, in logging units.
  final double tdeeKcal;
  final double bmrKcal;

  /// Estimated from logged training (not wearable active energy).
  final double trainingKcalPerDay;

  /// Last week's targets, for rate limiting; null on the first week.
  final DailyTargets? previous;

  final int consecutiveDeficitWeeks;

  /// Fat-loss pace chosen by the user (positive fraction per week, e.g.
  /// 0.0075). Clamped to the safety maximum. Defaults to 0.75%.
  final double? requestedLossFraction;
}
