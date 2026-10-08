import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'body_fat_estimate.dart';
import 'coach_snapshot.dart';
import 'cycle_noise.dart';
import 'deurenberg_body_fat.dart';
import 'initial_tdee_prior.dart';
import 'partition.dart';
import 'recommend_mode.dart';
import 'resting_energy_equations.dart';
import 'settling_shift.dart';
import 'settling_windows.dart';
import 'targets_record.dart';
import 'tdee_estimator.dart';
import 'weight_trend_model.dart';

/// Analyses stored history. Returns null until there is a weigh-in.
///
/// TDEE is estimated as of yesterday: today's intake is still in progress.
CoachSnapshot? analyze({
  required UserSetup setup,
  required List<WeightObservation> weights,
  required List<IntakeDay> intake,
  required CalendarDate today,
  List<MenstruationDay> flowDays = const [],
  List<TargetsRecord> history = const [],
  WeightTrendModel trendModel = const WeightTrendModel(),
  TdeeEstimator estimator = const TdeeEstimator(),
}) {
  if (weights.isEmpty) return null;
  final profile = setup.profile;
  final settling = settlingWindows(history);
  final trend = trendModel.smooth(
    weights,
    through: today,
    noiseMultiplier: flowDays.isEmpty ? null : cycleNoiseMultiplier(flowDays),
    shift: settling.isEmpty
        ? null
        : settlingShift(settling, weights.first.weightKg),
  );
  final trendWeight = trend.last.levelKg;
  // Body mass index is judged on the highest trend weight of the last seven
  // days, so one low reading, or a dip that lasts a day, changes nothing
  // (MM-111).
  final recent = trend.length > 7 ? trend.sublist(trend.length - 7) : trend;
  final policy = CoachingPolicy.derive(
    profile: profile,
    screening: setup.screening,
    today: today,
    weightKg: recent.map((p) => p.levelKg).reduce(math.max),
  );
  final age = profile.ageOn(today);

  final measured = setup.bodyFatPercent;
  final bodyFat = measured != null
      ? BodyFatEstimate(percent: measured, sigmaPercent: 4)
      : deurenbergBodyFat(
          sex: profile.sex,
          weightKg: trendWeight,
          heightCm: profile.heightCm,
          ageYears: age,
        );

  final bmr = mifflinStJeorKcal(
    sex: profile.sex,
    weightKg: trendWeight,
    heightCm: profile.heightCm,
    ageYears: age,
  );
  final tdee = estimator.estimate(
    asOf: today.addDays(-1),
    intake: intake,
    trend: trend,
    prior: initialTdeePrior(
      bmrKcal: bmr,
      dailyActivity: setup.dailyActivity,
      trainingDaysPerWeek: setup.trainingDaysPerWeek,
    ),
    bmrKcal: bmr,
    energyDensityForSlope: (slope) => energyDensityForSlope(
      slopeKgPerDay: slope,
      fatMassKg: bodyFat.fatMassKg(trendWeight),
      resistanceTrained: setup.trainingStatus.isResistanceTrained,
    ),
    settling: settling,
  );

  return CoachSnapshot(
    policy: policy,
    trend: trend,
    trendWeightKg: trendWeight,
    bodyFat: bodyFat,
    bmrKcal: bmr,
    tdee: tdee,
    recommendation: recommendMode(
      sex: profile.sex,
      bodyFatPercent: bodyFat.percent,
      trainingStatus: setup.trainingStatus,
      policy: policy,
    ),
  );
}
