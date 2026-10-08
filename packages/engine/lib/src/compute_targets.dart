import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'daily_targets.dart';
import 'partition.dart';
import 'safety_bounds.dart';
import 'target_flag.dart';
import 'target_inputs.dart';

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
    heightCm: i.heightCm,
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
