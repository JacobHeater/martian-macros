import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'body_composition.dart';
import 'partition.dart';
import 'safety_bounds.dart';

enum TargetFlag {
  /// The calorie target was raised to the safety floor.
  flooredAtSafetyMinimum,

  /// The change from last week was limited.
  rateLimited,

  /// Continuous deficit hit its limit; this week is at maintenance.
  dietBreak,

  /// The requested mode isn't allowed by the coaching policy; maintenance
  /// was used instead.
  modeNotAllowed,

  /// Protein was capped by the coaching policy.
  proteinCapped,
}

final class DailyTargets {
  const DailyTargets({
    required this.kcal,
    required this.proteinG,
    required this.fatG,
    required this.carbsG,
    required this.weeklyRateFraction,
    this.flags = const {},
  });

  final double kcal;
  final double proteinG;
  final double fatG;
  final double carbsG;

  /// Intended body-weight change per week as a fraction of body weight
  /// (negative = loss).
  final double weeklyRateFraction;

  final Set<TargetFlag> flags;
}

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

/// Computes the week's daily targets. Pure function of [i].
DailyTargets computeTargets(TargetInputs i) {
  final flags = <TargetFlag>{};

  var mode = i.mode;
  if (!i.policy.allowedModes.contains(mode)) {
    mode = GoalMode.maintenance;
    flags.add(TargetFlag.modeNotAllowed);
  }

  var rate = _weeklyRate(mode, i);
  if (rate < 0 &&
      i.consecutiveDeficitWeeks >= SafetyBounds.maxContinuousDeficitWeeks) {
    rate = 0;
    flags.add(TargetFlag.dietBreak);
  }

  final rho = energyDensityKcalPerKg(
    leanFractionOfChange(
      fatMassKg: i.bodyFat.fatMassKg(i.trendWeightKg),
      losing: rate < 0,
      resistanceTrained: i.trainingStatus.isResistanceTrained,
    ),
  );
  final dailyEnergyDelta = rho * rate * i.trendWeightKg / 7;
  var kcal = i.tdeeKcal + dailyEnergyDelta + i.policy.maintenanceOffsetKcal;

  final previous = i.previous;
  if (previous != null) {
    final maxStep = SafetyBounds.maxWeeklyTargetChange(previous.kcal);
    final limited = kcal.clamp(
      previous.kcal - maxStep,
      previous.kcal + maxStep,
    );
    if (limited != kcal) flags.add(TargetFlag.rateLimited);
    kcal = limited;
  }

  final floor = SafetyBounds.calorieFloorKcal(
    sex: i.sex,
    bmrKcal: i.bmrKcal,
    bodyFatPercent: i.bodyFat.percent,
    fatFreeMassUpperKg: i.bodyFat.fatFreeMassUpperKg(i.trendWeightKg),
    trainingKcalPerDay: i.trainingKcalPerDay,
  );
  if (kcal < floor) {
    kcal = floor;
    flags.add(TargetFlag.flooredAtSafetyMinimum);
  }

  final protein = SafetyBounds.proteinRangeG(
    sex: i.sex,
    weightKg: i.trendWeightKg,
    heightCm: i.heightCm,
    bodyFatPercent: i.bodyFat.percent,
    inDeficit: rate < 0,
    capGPerKg: i.policy.proteinCapGPerKg,
  );
  if (i.policy.proteinCapGPerKg != null) flags.add(TargetFlag.proteinCapped);
  final proteinG = protein.midG;

  final minFat = SafetyBounds.minFatG(
    sex: i.sex,
    weightKg: i.trendWeightKg,
    kcal: kcal,
  );
  var fatG = math.max(minFat, 0.25 * kcal / 9);
  var carbsG = (kcal - 4 * proteinG - 9 * fatG) / 4;
  if (carbsG < 0) {
    fatG = minFat;
    carbsG = math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4);
  }

  return DailyTargets(
    kcal: kcal,
    proteinG: proteinG,
    fatG: fatG,
    carbsG: carbsG,
    weeklyRateFraction: rate,
    flags: flags,
  );
}

double _weeklyRate(GoalMode mode, TargetInputs i) {
  final bf = i.bodyFat.percent;
  final highBodyFat = switch (i.sex) {
    BiologicalSex.male => bf >= 20,
    BiologicalSex.female => bf >= 30,
  };
  return switch (mode) {
    GoalMode.fatLoss => -math.min(
      i.requestedLossFraction ?? 0.0075,
      SafetyBounds.maxWeeklyLossFraction(i.sex, bf),
    ),
    GoalMode.recomp => highBodyFat ? -0.0025 : -0.001,
    GoalMode.leanGain => switch (i.trainingStatus) {
      TrainingStatus.untrained ||
      TrainingStatus.novice ||
      TrainingStatus.returning => 0.0035,
      _ => i.policy.elevatedMuscleGainPrior ? 0.0025 : 0.0015,
    },
    GoalMode.maintenance => 0,
  };
}
