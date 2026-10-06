import 'package:mm_domain/mm_domain.dart';

import 'body_composition.dart';
import 'cycle_noise.dart';
import 'energy_expenditure.dart';
import 'mode_advisor.dart';
import 'partition.dart';
import 'targets.dart';
import 'tdee_estimator.dart';
import 'weight_trend.dart';

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

/// Everything the engine currently believes about the user.
final class CoachSnapshot {
  const CoachSnapshot({
    required this.policy,
    required this.trend,
    required this.trendWeightKg,
    required this.bodyFat,
    required this.bmrKcal,
    required this.tdee,
    required this.recommendation,
  });

  final CoachingPolicy policy;

  /// One point per day from the first weigh-in; empty before any weigh-in.
  final List<WeightTrendPoint> trend;
  final double trendWeightKg;
  final BodyFatEstimate bodyFat;
  final double bmrKcal;
  final TdeeEstimate tdee;
  final ModeRecommendation recommendation;
}

/// Days of logging before targets may first adapt (the calibration period).
const int calibrationDays = 14;

/// Days between target changes.
const int checkInIntervalDays = 7;

/// Analyses stored history. Returns null until there is a weigh-in.
///
/// TDEE is estimated as of yesterday: today's intake is still in progress.
CoachSnapshot? analyze({
  required UserSetup setup,
  required List<WeightObservation> weights,
  required List<IntakeDay> intake,
  required CalendarDate today,
  List<MenstruationDay> flowDays = const [],
  WeightTrendModel trendModel = const WeightTrendModel(),
  TdeeEstimator estimator = const TdeeEstimator(),
}) {
  if (weights.isEmpty) return null;
  final profile = setup.profile;
  final policy = CoachingPolicy.derive(
    profile: profile,
    screening: setup.screening,
    today: today,
  );

  final trend = trendModel.smooth(
    weights,
    through: today,
    noiseMultiplier: flowDays.isEmpty ? null : cycleNoiseMultiplier(flowDays),
  );
  final trendWeight = trend.last.levelKg;
  final age = profile.ageOn(today);

  final measured = setup.bodyFatPercent;
  final bodyFat = measured != null
      ? BodyFatEstimate(percent: measured, sigmaPercent: 3)
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
      trainingDaysPerWeek: setup.trainingDaysPerWeek,
    ),
    bmrKcal: bmr,
    energyDensityForSlope: (slope) => energyDensityForSlope(
      slopeKgPerDay: slope,
      fatMassKg: bodyFat.fatMassKg(trendWeight),
      resistanceTrained: setup.trainingStatus.isResistanceTrained,
    ),
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

/// Decides whether targets change today. Returns the new record, or null to
/// keep the current ones.
///
/// - First run: initial targets from the formula prior.
/// - Mode change: immediate, with no step limit (a cut-to-maintenance
///   switch must not be throttled).
/// - Otherwise at most every [checkInIntervalDays], never during the
///   calibration period, and never when the estimator is holding.
TargetsRecord? nextTargets({
  required UserSetup setup,
  required CoachSnapshot snapshot,
  required List<TargetsRecord> history,
  required CalendarDate today,
}) {
  if (snapshot.policy.blocked) return null;

  TargetsRecord build({DailyTargets? previous, int deficitWeeks = 0}) =>
      TargetsRecord(
        effectiveFrom: today,
        mode: setup.goalMode,
        tdeeKcal: snapshot.tdee.kcal,
        tdeeSigmaKcal: snapshot.tdee.sigmaKcal,
        tdeeStatus: snapshot.tdee.status,
        targets: computeTargets(
          TargetInputs(
            sex: setup.profile.sex,
            heightCm: setup.profile.heightCm,
            trendWeightKg: snapshot.trendWeightKg,
            bodyFat: snapshot.bodyFat,
            mode: setup.goalMode,
            trainingStatus: setup.trainingStatus,
            policy: snapshot.policy,
            tdeeKcal: snapshot.tdee.kcal,
            bmrKcal: snapshot.bmrKcal,
            previous: previous,
            consecutiveDeficitWeeks: deficitWeeks,
            requestedLossFraction: setup.requestedLossFraction,
          ),
        ),
      );

  if (history.isEmpty) return build();
  final last = history.last;
  if (last.mode != setup.goalMode) return build();

  if (last.effectiveFrom.daysUntil(today) < checkInIntervalDays) return null;
  if (setup.onboardedOn.daysUntil(today) < calibrationDays) return null;
  if (snapshot.tdee.status == TdeeStatus.held) return null;

  return build(
    previous: last.targets,
    deficitWeeks: consecutiveDeficitWeeks(history, today),
  );
}

/// Whole weeks the user has been in an unbroken deficit as of [today].
int consecutiveDeficitWeeks(List<TargetsRecord> history, CalendarDate today) {
  CalendarDate? start;
  for (final record in history.reversed) {
    if (record.targets.weeklyRateFraction >= 0) break;
    start = record.effectiveFrom;
  }
  return start == null ? 0 : start.daysUntil(today) ~/ 7;
}
