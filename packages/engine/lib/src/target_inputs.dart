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
    this.trainingDaysPerWeek = 0,
    this.trainingKcalPerDay = 0,
    this.previous,
    this.consecutiveDeficitWeeks = 0,
    this.requestedLossFraction,
    this.safetyBodyFatPercent,
    this.safetyRaiseKcal = 0,
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
  final int trainingDaysPerWeek;

  /// Estimated from logged training (not wearable active energy).
  final double trainingKcalPerDay;

  /// Last week's targets, for rate limiting; null on the first week.
  final DailyTargets? previous;

  final int consecutiveDeficitWeeks;

  /// Fat-loss pace chosen by the user (positive fraction per week, e.g.
  /// 0.0075). Clamped to the safety maximum. Defaults to 0.75%.
  final double? requestedLossFraction;

  /// The body-fat figure the safety thresholds (loss limit, protein rule,
  /// energy-availability floor) are applied to, from `safetyBodyFatPercent`.
  /// Null: the cautious value of [bodyFat] with no memory of last week.
  final double? safetyBodyFatPercent;

  /// Added to last week's target even beyond the weekly step limit, because
  /// the user is losing faster than the safe pace (`lossSafetyRaiseKcal`).
  final double safetyRaiseKcal;
}
