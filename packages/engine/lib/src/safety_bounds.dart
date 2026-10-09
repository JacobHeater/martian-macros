import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'goal_body_fat_check.dart';
import 'protein_range.dart';
import 'protein_targets.dart';

/// Hard physiological limits. Every target the engine emits passes through
/// these.
///
/// Sources: NIH minimum-intake guidance (absolute floors), Loucks on low
/// energy availability (30 kcal/kg FFM), Garthe 2011 (slower loss preserves
/// lean mass), Helms 2014 (protein in lean, dieting athletes). The body-fat
/// goal floors are product judgement. This table must be signed off by a
/// registered dietitian before launch.
abstract final class SafetyBounds {
  /// Energy availability floor, kcal per kg fat-free mass per day.
  static const double minEnergyAvailabilityKcalPerKgFfm = 30;

  static const int maxContinuousDeficitWeeks = 16;
  static const double maxWeeklyTargetChangeKcal = 100;
  static const double maxWeeklyTargetChangeFraction = 0.05;

  static double absoluteFloorKcal(BiologicalSex sex) => switch (sex) {
    BiologicalSex.male => 1500,
    BiologicalSex.female => 1200,
  };

  /// Body fat at or below which the energy-availability floor applies.
  /// Low-energy-availability harm (RED-S) concentrates in lean users; for
  /// higher body fat the floor would forbid ordinary moderate deficits.
  static double energyAvailabilityThresholdPercent(BiologicalSex sex) =>
      switch (sex) {
        BiologicalSex.male => 15,
        BiologicalSex.female => 25,
      };

  /// The lowest calorie target the engine will ever emit: the larger of the
  /// absolute floor, BMR, and (for lean users) the energy-availability
  /// floor.
  ///
  /// Pass the *upper* bound of fat-free mass so that measurement
  /// uncertainty can only raise the floor.
  static double calorieFloorKcal({
    required BiologicalSex sex,
    required double bmrKcal,
    required double bodyFatPercent,
    required double fatFreeMassUpperKg,
    required double trainingKcalPerDay,
  }) => [
    absoluteFloorKcal(sex),
    bmrKcal,
    if (bodyFatPercent <= energyAvailabilityThresholdPercent(sex))
      minEnergyAvailabilityKcalPerKgFfm * fatFreeMassUpperKg +
          trainingKcalPerDay,
  ].reduce(math.max);

  /// Fastest allowed loss, as a fraction of body weight per week. Tapers as
  /// the user gets leaner.
  static double maxWeeklyLossFraction(
    BiologicalSex sex,
    double bodyFatPercent,
  ) {
    final (slowBelow, moderateBelow) = switch (sex) {
      BiologicalSex.male => (12.0, 15.0),
      BiologicalSex.female => (22.0, 25.0),
    };
    if (bodyFatPercent < slowBelow) return 0.005;
    if (bodyFatPercent < moderateBelow) return 0.007;
    return 0.010;
  }

  /// Largest allowed change from last week's calorie target.
  static double maxWeeklyTargetChange(double currentKcal) => math.min(
    maxWeeklyTargetChangeKcal,
    currentKcal * maxWeeklyTargetChangeFraction,
  );

  /// Share of the weight above BMI 25 that counts toward
  /// [referenceWeightKg].
  static const excessWeightFraction = 0.25;

  /// The weight per-kilogram macro rules scale with: body weight up to
  /// BMI 25, then the BMI-25 weight plus a quarter of the excess (the
  /// "adjusted body weight" convention). Continuous, and it never falls as
  /// weight rises, so a target cannot jump when a user crosses a BMI line.
  static double referenceWeightKg({
    required double weightKg,
    required double heightCm,
  }) {
    final heightM = heightCm / 100;
    final atBmi25 = 25 * heightM * heightM;
    if (weightKg <= atBmi25) return weightKg;
    return atBmi25 + excessWeightFraction * (weightKg - atBmi25);
  }

  /// Minimum daily fat, g: the larger of a floor per kg of reference weight
  /// and 20% of energy.
  static double minFatG({
    required BiologicalSex sex,
    required double weightKg,
    required double heightCm,
    required double kcal,
  }) {
    final perKg = switch (sex) {
      BiologicalSex.male => 0.5,
      BiologicalSex.female => 0.6,
    };
    final reference = referenceWeightKg(weightKg: weightKg, heightCm: heightCm);
    return math.max(perKg * reference, 0.20 * kcal / 9);
  }

  /// Chooses the protein minimum and target for the user's goal and training.
  static ProteinTargets proteinTargetsG({
    required BiologicalSex sex,
    required double weightKg,
    required double heightCm,
    required double bodyFatPercent,
    required bool inDeficit,
    required bool lifting,
    required CoachingPolicy policy,
  }) {
    final reference = referenceWeightKg(weightKg: weightKg, heightCm: heightCm);
    var minimum = (lifting ? 1.6 : 1.2) * reference;
    var target = (lifting ? (inDeficit ? 2.0 : 1.8) : 1.6) * reference;

    if (inDeficit) {
      final leanThreshold = switch (sex) {
        BiologicalSex.male => 15.0,
        BiologicalSex.female => 23.0,
      };
      final leanShare = ((leanThreshold + 3 - bodyFatPercent) / 3)
          .clamp(0.0, 1.0)
          .toDouble();
      if (leanShare > 0) {
        final fatFreeMass = weightKg * (1 - bodyFatPercent / 100);
        minimum = minimum * (1 - leanShare) + 2.3 * fatFreeMass * leanShare;
        target = target * (1 - leanShare) + 2.6 * fatFreeMass * leanShare;
      }
    }

    final seniorFloor = policy.minimumProteinGPerKgReferenceWeight;
    if (seniorFloor != null) {
      minimum = math.max(minimum, seniorFloor * reference);
    }

    final kidneyCap = policy.proteinCapGPerKg;
    if (kidneyCap != null) {
      final capped = kidneyCap * weightKg;
      return ProteinTargets(minimumG: capped, targetG: capped);
    }
    return ProteinTargets(minimumG: minimum, targetG: target);
  }

  /// Evidence range for protein, g; production targets use [proteinTargetsG].
  ///
  /// Lean users in a deficit get 2.3–3.1 g/kg fat-free mass (Helms 2014).
  /// Otherwise 1.6–2.2 g/kg of [referenceWeightKg], so heavier users don't
  /// get absurd targets.
  /// [capGPerKg] (kidney disease) caps everything.
  static ProteinRange proteinRangeG({
    required BiologicalSex sex,
    required double weightKg,
    required double heightCm,
    required double bodyFatPercent,
    required bool inDeficit,
    double? capGPerKg,
  }) {
    final leanThreshold = switch (sex) {
      BiologicalSex.male => 15.0,
      BiologicalSex.female => 23.0,
    };
    ProteinRange range;
    if (inDeficit && bodyFatPercent <= leanThreshold) {
      final ffm = weightKg * (1 - bodyFatPercent / 100);
      range = ProteinRange(2.3 * ffm, 3.1 * ffm);
    } else {
      final reference = referenceWeightKg(
        weightKg: weightKg,
        heightCm: heightCm,
      );
      range = ProteinRange(1.6 * reference, 2.2 * reference);
    }
    if (capGPerKg != null) {
      final cap = capGPerKg * weightKg;
      range = ProteinRange(
        math.min(range.minG, cap),
        math.min(range.maxG, cap),
      );
    }
    return range;
  }

  /// Validates a user-chosen goal body fat.
  static GoalBodyFatCheck checkGoalBodyFat(BiologicalSex sex, double percent) {
    final (hardFloor, softFloor) = switch (sex) {
      BiologicalSex.male => (8.0, 10.0),
      BiologicalSex.female => (16.0, 18.0),
    };
    if (percent < hardFloor) return GoalBodyFatCheck.rejected;
    if (percent < softFloor) return GoalBodyFatCheck.warnAndTimeLimit;
    return GoalBodyFatCheck.accepted;
  }
}
