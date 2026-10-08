import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'synthetic_user.dart';
import 'week_result.dart';

/// Runs the full coaching loop the app will run: daily logs and weigh-ins,
/// a weekly check-in that re-smooths the trend, re-estimates TDEE, and
/// recomputes bounded targets.
List<WeekResult> runCoachLoop({
  required SyntheticUser user,
  required Profile profile,
  required GoalMode mode,
  required int weeks,
  TrainingStatus trainingStatus = TrainingStatus.intermediate,
  int trainingDaysPerWeek = 3,
  void Function(int week, SyntheticUser user)? beforeWeek,
  TdeeEstimator estimator = const TdeeEstimator(),
  bool settle = true,
  GoalMode Function(int week)? modeAt,
}) {
  final policy = CoachingPolicy.derive(
    profile: profile,
    screening: const ScreeningAnswers(),
    today: user.today,
  );
  final intakeLog = <IntakeDay>[];
  final weightLog = <WeightObservation>[];
  const trendModel = WeightTrendModel();

  double bmrFor(double weightKg) => mifflinStJeorKcal(
    sex: profile.sex,
    weightKg: weightKg,
    heightCm: profile.heightCm,
    ageYears: profile.ageOn(user.today),
  );

  final startBmr = bmrFor(user.weightKg);
  final prior = initialTdeePrior(
    bmrKcal: startBmr,
    trainingDaysPerWeek: trainingDaysPerWeek,
  );
  var tdee = TdeeEstimate(
    kcal: prior.kcal,
    sigmaKcal: prior.sigmaKcal,
    status: TdeeStatus.held,
  );
  final startBodyFat = deurenbergBodyFat(
    sex: profile.sex,
    weightKg: user.weightKg,
    heightCm: profile.heightCm,
    ageYears: profile.ageOn(user.today),
  );

  DailyTargets? targets;
  var trendWeight = user.weightKg;
  var deficitWeeks = 0;
  final results = <WeekResult>[];
  final history = <TargetsRecord>[];

  var currentMode = mode;
  for (var week = 0; week < weeks; week++) {
    beforeWeek?.call(week, user);
    final weekMode = modeAt?.call(week) ?? mode;
    final modeChanged = weekMode != currentMode;
    currentMode = weekMode;

    if (week > 0) {
      final asOf = user.today.addDays(-1);
      final settling = settle
          ? settlingWindows(history)
          : const <SettlingWindow>[];
      final trend = trendModel.smooth(
        weightLog,
        through: asOf,
        shift: settlingShift(settling, user.startWeightKg),
      );
      trendWeight = trend.last.levelKg;
      final bmr = bmrFor(trendWeight);
      tdee = estimator.estimate(
        asOf: asOf,
        intake: intakeLog,
        trend: trend,
        prior: prior,
        bmrKcal: bmr,
        energyDensityForSlope: (slope) => energyDensityForSlope(
          slopeKgPerDay: slope,
          fatMassKg: startBodyFat.fatMassKg(trendWeight),
          resistanceTrained: trainingStatus.isResistanceTrained,
        ),
        settling: settling,
      );
    }

    // As in `nextTargets`: nothing changes during calibration or while the
    // estimate is held, and a change of goal applies at once, unthrottled.
    if (targets == null ||
        modeChanged ||
        (week >= 2 && tdee.status == TdeeStatus.updated)) {
      targets = computeTargets(
        TargetInputs(
          sex: profile.sex,
          heightCm: profile.heightCm,
          trendWeightKg: trendWeight,
          bodyFat: startBodyFat,
          mode: currentMode,
          trainingStatus: trainingStatus,
          policy: policy,
          tdeeKcal: tdee.kcal,
          bmrKcal: bmrFor(trendWeight),
          previous: modeChanged ? null : targets,
          consecutiveDeficitWeeks: deficitWeeks,
        ),
      );
    }
    if (history.isEmpty || history.last.targets != targets) {
      history.add(
        TargetsRecord(
          effectiveFrom: user.today,
          targets: targets,
          mode: currentMode,
          tdeeKcal: tdee.kcal,
          tdeeSigmaKcal: tdee.sigmaKcal,
          tdeeStatus: tdee.status,
        ),
      );
    }
    if (targets.weeklyRateFraction < 0) {
      deficitWeeks++;
    } else {
      deficitWeeks = 0;
    }

    results.add(
      WeekResult(
        week: week,
        targets: targets,
        tdee: tdee,
        trueTdeeKcal: user.trueTdeeKcal,
        trueWeightKg: user.weightKg,
        underReportFraction: user.underReportFraction,
      ),
    );

    for (var day = 0; day < 7; day++) {
      final (:intake, :weight) = user.liveDay(targets.kcal);
      if (intake != null) intakeLog.add(intake);
      if (weight != null) weightLog.add(weight);
    }
  }
  return results;
}
