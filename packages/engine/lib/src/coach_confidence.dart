import 'package:mm_domain/mm_domain.dart';

import 'confidence_level.dart';
import 'confidence_next_step.dart';
import 'settling_windows.dart';
import 'targets_record.dart';
import 'tdee_estimate.dart';
import 'tdee_estimator.dart';
import 'tdee_status.dart';
import 'weight_trend_point.dart';

const double confidenceGoodEstimateSigmaKcal = 200;
const double confidenceLearningEstimateSigmaKcal = 350;
const int confidenceGoodFoodDays = 20;
const int confidenceMinimumFoodDays = 10;
const int confidenceGoodWeighInDays = 20;
const int confidenceMinimumWeighInDays = 8;
const int confidenceStabilityDays = 14;

/// How reliable the current coaching estimate is and what would improve it.
final class CoachConfidence {
  const CoachConfidence({
    required this.level,
    required this.estimate,
    required this.foodLog,
    required this.weighIns,
    required this.stability,
    required this.nextStep,
    required this.usableFoodDays,
    required this.weighInDays,
  });

  final ConfidenceLevel level;
  final ConfidenceLevel estimate;
  final ConfidenceLevel foodLog;
  final ConfidenceLevel weighIns;
  final ConfidenceLevel stability;
  final ConfidenceNextStep nextStep;
  final int usableFoodDays;
  final int weighInDays;

  Map<String, Object> toJson() => {
    'level': level.name,
    'estimate': estimate.name,
    'foodLog': foodLog.name,
    'weighIns': weighIns.name,
    'stability': stability.name,
    'nextStep': nextStep.name,
    'usableFoodDays': usableFoodDays,
    'weighInDays': weighInDays,
  };

  factory CoachConfidence.fromJson(Map<String, Object?> json) =>
      CoachConfidence(
        level: ConfidenceLevel.values.byName(json['level']! as String),
        estimate: ConfidenceLevel.values.byName(json['estimate']! as String),
        foodLog: ConfidenceLevel.values.byName(json['foodLog']! as String),
        weighIns: ConfidenceLevel.values.byName(json['weighIns']! as String),
        stability: ConfidenceLevel.values.byName(json['stability']! as String),
        nextStep: ConfidenceNextStep.values.byName(json['nextStep']! as String),
        usableFoodDays: (json['usableFoodDays']! as num).toInt(),
        weighInDays: (json['weighInDays']! as num).toInt(),
      );
}

/// Classifies the current estimate using the MM-139 boundaries.
CoachConfidence assessCoachConfidence({
  required TdeeEstimate estimate,
  required CalendarDate asOf,
  required Iterable<IntakeDay> intake,
  required Iterable<WeightTrendPoint> trend,
  required List<TargetsRecord> history,
  CalendarDate? lastWeightEventOn,
}) {
  const estimator = TdeeEstimator();
  final start = asOf.addDays(1 - estimator.windowDays);
  final usableFoodDays = estimator.countUsableIntakeDays(
    intake: intake,
    start: start,
    end: asOf,
  );
  final weighInDays = trend
      .where(
        (point) =>
            point.observed &&
            !point.date.isBefore(start) &&
            !point.date.isAfter(asOf),
      )
      .length;

  final estimateLevel =
      estimate.status != TdeeStatus.updated ||
          estimate.sigmaKcal > confidenceLearningEstimateSigmaKcal
      ? ConfidenceLevel.learning
      : estimate.sigmaKcal < confidenceGoodEstimateSigmaKcal
      ? ConfidenceLevel.good
      : ConfidenceLevel.fair;
  final foodLevel = usableFoodDays >= confidenceGoodFoodDays
      ? ConfidenceLevel.good
      : usableFoodDays >= confidenceMinimumFoodDays
      ? ConfidenceLevel.fair
      : ConfidenceLevel.learning;
  final weighInLevel = weighInDays >= confidenceGoodWeighInDays
      ? ConfidenceLevel.good
      : weighInDays >= confidenceMinimumWeighInDays
      ? ConfidenceLevel.fair
      : ConfidenceLevel.learning;

  final recentStart = asOf.addDays(1 - confidenceStabilityDays);
  final recentPhaseChange = settlingWindows(history).any(
    (window) =>
        !window.start.isAfter(asOf) && !window.end.isBefore(recentStart),
  );
  final restart = estimate.styleRestartOn;
  final recentStyleRestart =
      restart != null &&
      !restart.isBefore(recentStart) &&
      !restart.isAfter(asOf);
  final recentWeightEvent =
      lastWeightEventOn != null &&
      !lastWeightEventOn.isBefore(recentStart) &&
      !lastWeightEventOn.isAfter(asOf);
  final stabilityLevel = estimate.clampedToBounds
      ? ConfidenceLevel.learning
      : recentPhaseChange || recentStyleRestart || recentWeightEvent
      ? ConfidenceLevel.fair
      : ConfidenceLevel.good;

  final levels = [estimateLevel, foodLevel, weighInLevel, stabilityLevel];
  final level = levels.contains(ConfidenceLevel.learning)
      ? ConfidenceLevel.learning
      : levels.contains(ConfidenceLevel.fair)
      ? ConfidenceLevel.fair
      : ConfidenceLevel.good;
  final nextStep = _nextStep(
    estimate: estimate,
    estimateLevel: estimateLevel,
    foodLevel: foodLevel,
    weighInLevel: weighInLevel,
    stabilityLevel: stabilityLevel,
    usableFoodDays: usableFoodDays,
    weighInDays: weighInDays,
  );

  return CoachConfidence(
    level: level,
    estimate: estimateLevel,
    foodLog: foodLevel,
    weighIns: weighInLevel,
    stability: stabilityLevel,
    nextStep: nextStep,
    usableFoodDays: usableFoodDays,
    weighInDays: weighInDays,
  );
}

ConfidenceNextStep _nextStep({
  required TdeeEstimate estimate,
  required ConfidenceLevel estimateLevel,
  required ConfidenceLevel foodLevel,
  required ConfidenceLevel weighInLevel,
  required ConfidenceLevel stabilityLevel,
  required int usableFoodDays,
  required int weighInDays,
}) {
  if (estimate.clampedToBounds) return ConfidenceNextStep.reviewFoodLogging;
  if (estimate.settlingUntil != null ||
      stabilityLevel == ConfidenceLevel.fair) {
    return ConfidenceNextStep.waitForStability;
  }
  if (foodLevel == ConfidenceLevel.learning ||
      (estimate.status == TdeeStatus.held &&
          usableFoodDays < confidenceMinimumFoodDays)) {
    return ConfidenceNextStep.completeFoodLog;
  }
  if (weighInLevel == ConfidenceLevel.learning ||
      weighInDays < confidenceGoodWeighInDays) {
    return ConfidenceNextStep.recordWeight;
  }
  if (estimateLevel != ConfidenceLevel.good) {
    return ConfidenceNextStep.keepLogging;
  }
  if (foodLevel == ConfidenceLevel.fair) {
    return ConfidenceNextStep.completeFoodLog;
  }
  if (weighInLevel == ConfidenceLevel.fair) {
    return ConfidenceNextStep.recordWeight;
  }
  return ConfidenceNextStep.keepLogging;
}
