import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'daily_targets.dart';
import 'partition.dart';
import 'safety_body_fat.dart';
import 'safety_bounds.dart';
import 'target_flag.dart';
import 'target_inputs.dart';
import 'targets_trace.dart';

/// Computes the week's daily targets. Pure function of [i].
DailyTargets computeTargets(TargetInputs i) => computeTargetsTraced(i).targets;

/// [computeTargets], with the calorie target at each stage, so a change can
/// be explained (MM-138).
({DailyTargets targets, TargetsTrace trace}) computeTargetsTraced(
  TargetInputs i,
) {
  final flags = <TargetFlag>{};
  final safetyBf = i.safetyBodyFatPercent ?? cautiousBodyFatPercent(i.bodyFat);

  var mode = i.mode;
  if (!i.policy.allowedModes.contains(mode)) {
    mode = GoalMode.maintenance;
    flags.add(
      i.policy.underweight
          ? TargetFlag.underweightMaintenance
          : TargetFlag.modeNotAllowed,
    );
  }

  var rate = _weeklyRate(mode, i, safetyBf);
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
  final formulaKcal = kcal;
  var limitedKcal = kcal;
  var heldKcal = kcal;
  var raisedKcal = kcal;

  final previous = i.previous;
  if (previous != null) {
    // A raise the safety rules ask for is not step-limited: a diet break, a
    // too-fast loss, and a deficit the health check or body weight no longer
    // allows all exist to put calories back now. Reductions and
    // ordinary changes keep the limit.
    final exemptRaise =
        (flags.contains(TargetFlag.dietBreak) ||
            flags.contains(TargetFlag.underweightMaintenance) ||
            flags.contains(TargetFlag.modeNotAllowed)) &&
        kcal > previous.kcal;
    if (!exemptRaise) {
      final maxStep = SafetyBounds.maxWeeklyTargetChange(previous.kcal);
      final limited = kcal.clamp(
        previous.kcal - maxStep,
        previous.kcal + maxStep,
      );
      if (limited != kcal) flags.add(TargetFlag.rateLimited);
      kcal = limited;
    }
    limitedKcal = kcal;
    if (previous.flags.contains(TargetFlag.raisedForSafePace) &&
        i.safetyRaiseKcal == 0 &&
        kcal < previous.kcal) {
      kcal = previous.kcal;
      flags
        ..remove(TargetFlag.rateLimited)
        ..add(TargetFlag.heldAfterSafetyRaise);
    }
    heldKcal = kcal;
    if (i.safetyRaiseKcal > 0 && previous.kcal + i.safetyRaiseKcal > kcal) {
      kcal = previous.kcal + i.safetyRaiseKcal;
      flags
        ..remove(TargetFlag.rateLimited)
        ..add(TargetFlag.raisedForSafePace);
    }
    raisedKcal = kcal;
  }

  final floor = SafetyBounds.calorieFloorKcal(
    sex: i.sex,
    bmrKcal: i.bmrKcal,
    bodyFatPercent: safetyBf,
    fatFreeMassUpperKg: i.bodyFat.fatFreeMassUpperKg(i.trendWeightKg),
    trainingKcalPerDay: i.trainingKcalPerDay,
  );
  if (kcal < floor) {
    kcal = floor;
    flags.add(TargetFlag.flooredAtSafetyMinimum);
  }

  final protein = SafetyBounds.proteinTargetsG(
    sex: i.sex,
    weightKg: i.trendWeightKg,
    heightCm: i.heightCm,
    bodyFatPercent: safetyBf,
    inDeficit: rate < 0,
    lifting:
        !(i.trainingStatus == TrainingStatus.untrained &&
            i.trainingDaysPerWeek == 0),
    policy: i.policy,
  );
  if (i.policy.proteinCapGPerKg != null) flags.add(TargetFlag.proteinCapped);
  final proteinG = protein.targetG;

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

  return (
    targets: DailyTargets(
      kcal: kcal,
      proteinG: proteinG,
      proteinMinimumG: protein.minimumG,
      fatG: fatG,
      carbsG: carbsG,
      weeklyRateFraction: rate,
      flags: flags,
    ),
    trace: TargetsTrace(
      formulaKcal: formulaKcal,
      limitedKcal: limitedKcal,
      heldKcal: heldKcal,
      raisedKcal: raisedKcal,
      finalKcal: kcal,
    ),
  );
}

double _weeklyRate(GoalMode mode, TargetInputs i, double safetyBf) {
  final bf = i.bodyFat.percent;
  final highBodyFat = switch (i.sex) {
    BiologicalSex.male => bf >= 20,
    BiologicalSex.female => bf >= 30,
  };
  return switch (mode) {
    GoalMode.fatLoss => -math.min(
      math.min(
        i.requestedLossFraction ?? 0.0075,
        SafetyBounds.maxWeeklyLossFraction(i.sex, safetyBf),
      ),
      i.policy.maxWeeklyLossFraction ?? double.infinity,
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
