import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/synthetic_user.dart';

void main() {
  final start = CalendarDate(2026, 1, 1);

  UserSetup setup({GoalMode mode = GoalMode.fatLoss}) => UserSetup(
    profile: Profile(
      sex: BiologicalSex.male,
      birthDate: CalendarDate(1994, 3, 1),
      heightCm: 180,
    ),
    screening: const ScreeningAnswers(),
    trainingStatus: TrainingStatus.intermediate,
    trainingDaysPerWeek: 3,
    goalMode: mode,
    onboardedOn: start,
  );

  /// Simulates [days] of a user eating to [loggedKcal], from [start].
  (List<WeightObservation>, List<IntakeDay>) history(int days) {
    final user = SyntheticUser(seed: 7, start: start, baseTdeeKcal: 2900);
    final weights = <WeightObservation>[];
    final intake = <IntakeDay>[];
    for (var d = 0; d < days; d++) {
      final day = user.liveDay(2200);
      if (day.weight != null) weights.add(day.weight!);
      if (day.intake != null) intake.add(day.intake!);
    }
    return (weights, intake);
  }

  CoachSnapshot snapshotAt(
    int day, {
    UserSetup? forSetup,
    bool logFood = true,
  }) {
    final (weights, intake) = history(day);
    return analyze(
      setup: forSetup ?? setup(),
      weights: weights,
      intake: logFood ? intake : const [],
      today: start.addDays(day),
    )!;
  }

  test('there is nothing to analyse before the first weigh-in', () {
    expect(
      analyze(
        setup: setup(),
        weights: const [],
        intake: const [],
        today: start,
      ),
      isNull,
    );
  });

  test('a single weigh-in is enough for a snapshot and first targets', () {
    final snapshot = analyze(
      setup: setup(),
      weights: [WeightObservation(date: start, weightKg: 85)],
      intake: const [],
      today: start,
    )!;
    expect(snapshot.trendWeightKg, 85);
    expect(snapshot.tdee.status, TdeeStatus.held);

    final first = nextTargets(
      setup: setup(),
      snapshot: snapshot,
      history: const [],
      today: start,
    )!;
    expect(first.effectiveFrom, start);
    expect(first.targets.kcal, lessThan(snapshot.tdee.kcal));
    expect(first.tdeeStatus, TdeeStatus.held);
  });

  group('check-in cadence', () {
    late TargetsRecord first;
    setUp(() {
      first = nextTargets(
        setup: setup(),
        snapshot: snapshotAt(1),
        history: const [],
        today: start,
      )!;
    });

    TargetsRecord? at(int day, {bool logFood = true}) => nextTargets(
      setup: setup(),
      snapshot: snapshotAt(day, logFood: logFood),
      history: [first],
      today: start.addDays(day),
    );

    test('holds within the same week', () {
      expect(at(3), isNull);
    });

    test('holds through the calibration period even with good data', () {
      expect(at(7), isNull);
      expect(at(13), isNull);
    });

    test('adapts once calibration ends, by a limited step', () {
      final next = at(14)!;
      expect(next.tdeeStatus, TdeeStatus.updated);
      expect(next.effectiveFrom, start.addDays(14));
      expect(
        (next.targets.kcal - first.targets.kcal).abs(),
        lessThanOrEqualTo(100 + 1e-9),
      );
    });

    test('never changes targets while the estimator is holding', () {
      expect(at(21, logFood: false), isNull);
    });

    test('a goal change applies immediately, with no step limit', () {
      final maintenance = setup(mode: GoalMode.maintenance);
      final next = nextTargets(
        setup: maintenance,
        snapshot: snapshotAt(3, forSetup: maintenance),
        history: [first],
        today: start.addDays(3),
      )!;
      expect(next.mode, GoalMode.maintenance);
      expect(next.targets.weeklyRateFraction, 0);
      expect(next.targets.kcal - first.targets.kcal, greaterThan(100));
    });
  });

  test('blocked users get no targets', () {
    final minor = UserSetup(
      profile: Profile(
        sex: BiologicalSex.female,
        birthDate: CalendarDate(2012, 1, 1),
        heightCm: 160,
      ),
      screening: const ScreeningAnswers(),
      trainingStatus: TrainingStatus.novice,
      trainingDaysPerWeek: 2,
      goalMode: GoalMode.fatLoss,
      onboardedOn: start,
    );
    final snapshot = analyze(
      setup: minor,
      weights: [WeightObservation(date: start, weightKg: 55)],
      intake: const [],
      today: start,
    )!;
    expect(
      nextTargets(
        setup: minor,
        snapshot: snapshot,
        history: const [],
        today: start,
      ),
      isNull,
    );
  });

  test('counts whole weeks of unbroken deficit', () {
    TargetsRecord record(int day, double rate) => TargetsRecord(
      effectiveFrom: start.addDays(day),
      mode: GoalMode.fatLoss,
      tdeeKcal: 2500,
      tdeeSigmaKcal: 200,
      tdeeStatus: TdeeStatus.updated,
      targets: DailyTargets(
        kcal: 2000,
        proteinG: 150,
        fatG: 60,
        carbsG: 200,
        weeklyRateFraction: rate,
      ),
    );
    final today = start.addDays(50);
    expect(consecutiveDeficitWeeks(const [], today), 0);
    expect(
      consecutiveDeficitWeeks([record(0, -0.007), record(14, -0.007)], today),
      7,
    );
    // A maintenance break resets the count.
    expect(
      consecutiveDeficitWeeks([
        record(0, -0.007),
        record(21, 0),
        record(28, -0.007),
      ], today),
      3,
    );
  });
}
