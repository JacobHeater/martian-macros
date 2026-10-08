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

/// Days after a change in intake level during which the scale is moved by
/// glycogen, water and gut contents, not tissue.
const int settlingDays = 10;

/// A change in calorie target larger than this share of expenditure counts
/// as a change of intake level.
const double phaseChangeFraction = 0.10;

/// How far the trend level may shift per day inside a settling window, as
/// a share of body weight, beyond ordinary tissue change.
const double settlingShiftFraction = 0.004;

/// How far the trend's slope may change per day inside a settling window,
/// as a share of body weight per day. A change of intake level is a change
/// of pace.
const double settlingSlopeShiftFraction = 0.0004;

/// For the trend filter: the extra movement allowed on each day of a
/// settling window.
TrendShift? Function(CalendarDate) settlingShift(
  List<SettlingWindow> windows,
  double weightKg,
) {
  final shift = TrendShift(
    levelSigmaKg: settlingShiftFraction * weightKg,
    slopeSigmaKgPerDay: settlingSlopeShiftFraction * weightKg,
  );
  return (date) => windows.any((w) => w.contains(date)) ? shift : null;
}

/// The settling window after each change of intake level in [history].
///
/// The first targets are compared with expenditure, on the assumption that
/// the user was eating at maintenance before they started.
List<SettlingWindow> settlingWindows(List<TargetsRecord> history) {
  final windows = <SettlingWindow>[];
  TargetsRecord? previous;
  for (final record in history) {
    final change = previous == null
        ? record.targets.kcal - record.tdeeKcal
        : record.targets.kcal - previous.targets.kcal;
    if (change.abs() > phaseChangeFraction * record.tdeeKcal) {
      windows.add(
        SettlingWindow(
          record.effectiveFrom,
          record.effectiveFrom.addDays(settlingDays - 1),
        ),
      );
    }
    previous = record;
  }
  return windows;
}

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
  final policy = CoachingPolicy.derive(
    profile: profile,
    screening: setup.screening,
    today: today,
  );

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
