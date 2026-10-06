import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'synthetic_user.dart';

/// Weekly snapshot from a closed-loop run.
final class WeekResult {
  const WeekResult({
    required this.week,
    required this.targets,
    required this.tdee,
    required this.trueTdeeKcal,
    required this.trueWeightKg,
    required this.underReportFraction,
  });

  final int week;
  final DailyTargets targets;
  final TdeeEstimate tdee;
  final double trueTdeeKcal;
  final double trueWeightKg;
  final double underReportFraction;
}

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
}) {
  final policy = CoachingPolicy.derive(
    profile: profile,
    screening: const ScreeningAnswers(),
    today: user.today,
  );
  final intakeLog = <IntakeDay>[];
  final weightLog = <WeightObservation>[];
  const trendModel = WeightTrendModel();
  const estimator = TdeeEstimator();

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

  for (var week = 0; week < weeks; week++) {
    beforeWeek?.call(week, user);

    if (week > 0) {
      final asOf = user.today.addDays(-1);
      final trend = trendModel.smooth(weightLog, through: asOf);
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
      );
    }

    // Calibration week: hold the initial targets, never adjust.
    if (targets == null || week >= 2) {
      targets = computeTargets(
        TargetInputs(
          sex: profile.sex,
          heightCm: profile.heightCm,
          trendWeightKg: trendWeight,
          bodyFat: startBodyFat,
          mode: mode,
          trainingStatus: trainingStatus,
          policy: policy,
          tdeeKcal: tdee.kcal,
          bmrKcal: bmrFor(trendWeight),
          previous: targets,
          consecutiveDeficitWeeks: deficitWeeks,
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
