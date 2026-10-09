import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/synthetic_user.dart';
import 'support/trend_points.dart';

/// MM-115 through `nextTargets`, the function the app calls.
void main() {
  final start = CalendarDate(2026, 1, 1);

  UserSetup setup({
    required CalendarDate onboardedOn,
    ScreeningAnswers screening = const ScreeningAnswers(),
  }) => UserSetup(
    profile: Profile(
      sex: BiologicalSex.male,
      birthDate: CalendarDate(1994, 3, 1),
      heightCm: 180,
    ),
    screening: screening,
    trainingStatus: TrainingStatus.intermediate,
    trainingDaysPerWeek: 3,
    goalMode: GoalMode.fatLoss,
    onboardedOn: onboardedOn,
  );

  /// A man eating far under his expenditure for [days] days.
  CoachSnapshot snapshotAfter(int days, UserSetup forSetup) {
    final user = SyntheticUser(
      seed: 9,
      start: start,
      baseTdeeKcal: 3500,
      startWeightKg: 85,
      bodyFatPercent: 25,
      skipWeighInProbability: 0.1,
    );
    final weights = <WeightObservation>[];
    final intake = <IntakeDay>[];
    for (var d = 0; d < days; d++) {
      final day = user.liveDay(2200);
      if (day.weight != null) weights.add(day.weight!);
      if (day.intake != null) intake.add(day.intake!);
    }
    return analyze(
      setup: forSetup,
      weights: weights,
      intake: intake,
      today: start.addDays(days),
    )!;
  }

  test('a clear, too-fast loss raises the target even during calibration', () {
    // Targets began on day 0; the user (re)started coaching on day 30, so the
    // calibration period is not over on day 35 and ordinary adaptation waits.
    final s = setup(onboardedOn: start.addDays(30));
    final snapshot = snapshotAfter(35, s);
    final first = deficitStartingOn(start);

    final next = nextTargets(
      setup: s,
      snapshot: snapshot,
      history: [first],
      today: start.addDays(35),
    );
    expect(next, isNotNull);
    expect(next!.targets.flags, contains(TargetFlag.raisedForSafePace));
    expect(next.targets.kcal, greaterThan(first.targets.kcal + 100));
    expect(
      next.targets.kcal,
      lessThanOrEqualTo(first.targets.kcal + safetyRaiseCapKcal + 1e-9),
    );
  });

  test('the same data waits for calibration when the loss is not too fast', () {
    final s = setup(onboardedOn: start.addDays(30));
    final snapshot = snapshotAfter(35, s);
    // A slower loss: an easier deficit in the same shape of data.
    final slow = CoachSnapshot(
      policy: snapshot.policy,
      trend: trendOf(
        start: start.addDays(15),
        days: 20,
        levelKg: 85,
        lossFractionPerWeek: 0.006,
      ),
      trendWeightKg: snapshot.trendWeightKg,
      bodyFat: snapshot.bodyFat,
      bmrKcal: snapshot.bmrKcal,
      tdee: snapshot.tdee,
      confidence: snapshot.confidence,
      recommendation: snapshot.recommendation,
    );
    expect(
      nextTargets(
        setup: s,
        snapshot: slow,
        history: [deficitStartingOn(start)],
        today: start.addDays(35),
      ),
      isNull,
    );
  });

  test('an updated estimate still waits while confidence is Learning', () {
    final s = setup(onboardedOn: start);
    final base = snapshotAfter(35, s);
    final snapshot = CoachSnapshot(
      policy: base.policy,
      trend: trendOf(
        start: start.addDays(5),
        days: 30,
        levelKg: 85,
        lossFractionPerWeek: 0,
      ),
      trendWeightKg: base.trendWeightKg,
      bodyFat: base.bodyFat,
      bmrKcal: base.bmrKcal,
      tdee: TdeeEstimate(
        kcal: base.tdee.kcal,
        sigmaKcal: base.tdee.sigmaKcal,
        status: TdeeStatus.updated,
        usableIntakeDays: base.tdee.usableIntakeDays,
        excludedPartialDays: base.tdee.excludedPartialDays,
        weighIns: base.tdee.weighIns,
      ),
      confidence: const CoachConfidence(
        level: ConfidenceLevel.learning,
        estimate: ConfidenceLevel.learning,
        foodLog: ConfidenceLevel.good,
        weighIns: ConfidenceLevel.good,
        stability: ConfidenceLevel.good,
        nextStep: ConfidenceNextStep.keepLogging,
        usableFoodDays: 24,
        weighInDays: 24,
      ),
      recommendation: base.recommendation,
    );

    expect(
      nextTargets(
        setup: s,
        snapshot: snapshot,
        history: [deficitStartingOn(start)],
        today: start.addDays(35),
      ),
      isNull,
    );
  });

  test('nothing is raised before the weekly check-in is due', () {
    final s = setup(onboardedOn: start.addDays(30));
    final snapshot = snapshotAfter(35, s);
    expect(
      nextTargets(
        setup: s,
        snapshot: snapshot,
        history: [deficitStartingOn(start.addDays(32))],
        today: start.addDays(35),
      ),
      isNull,
    );
  });

  test('bariatric surgery prevents issuing targets', () {
    final s = setup(
      onboardedOn: start,
      screening: const ScreeningAnswers(bariatricSurgery: true),
    );
    final snapshot = snapshotAfter(35, s);
    expect(
      nextTargets(setup: s, snapshot: snapshot, history: [], today: start),
      isNull,
    );
  });
}
