import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-147: what a gap is, and what it means for the coach.
void main() {
  final start = CalendarDate(2026, 1, 1);
  WeightObservation weigh(int day, [double kg = 85]) =>
      WeightObservation(date: start.addDays(day), weightKg: kg);
  IntakeDay ate(int day, [double kcal = 2000]) => IntakeDay(
    date: start.addDays(day),
    kcal: kcal,
    proteinG: 120,
    carbsG: 200,
    fatG: 70,
  );

  TargetsRecord record(
    int day, {
    double rate = -0.005,
    TdeeStatus status = TdeeStatus.updated,
    double tdee = 2700,
    double sigma = 150,
  }) => TargetsRecord(
    effectiveFrom: start.addDays(day),
    targets: DailyTargets(
      kcal: 2200,
      proteinG: 160,
      fatG: 70,
      carbsG: 220,
      weeklyRateFraction: rate,
    ),
    mode: GoalMode.fatLoss,
    tdeeKcal: tdee,
    tdeeSigmaKcal: sigma,
    tdeeStatus: status,
  );

  group('a gap', () {
    test('is 7 or more days with no weigh-in and no food', () {
      final gaps = activityGaps(
        weights: [weigh(0), weigh(8)],
        intake: const [],
        today: start.addDays(8),
      );
      expect(gaps.single.from, start.addDays(1));
      expect(gaps.single.to, start.addDays(7));
      expect(gaps.single.days, 7);
    });

    test('six empty days is not one', () {
      expect(
        activityGaps(
          weights: [weigh(0), weigh(7)],
          intake: const [],
          today: start.addDays(7),
        ),
        isEmpty,
      );
    });

    test('food logged inside it means there was no gap', () {
      expect(
        activityGaps(
          weights: [weigh(0), weigh(20)],
          intake: [ate(6), ate(13)],
          today: start.addDays(20),
        ),
        isEmpty,
      );
    });

    test('an empty food day is not activity', () {
      expect(
        activityGaps(
          weights: [weigh(0), weigh(20)],
          intake: [ate(10, 0)],
          today: start.addDays(20),
        ),
        hasLength(1),
      );
    });

    test('is open on the day of return until something is recorded', () {
      final today = start.addDays(22);
      final open = openGap(weights: [weigh(0)], intake: const [], today: today);
      expect(open!.days, 21);
      expect(open.returnOn, today);
      expect(
        openGap(weights: [weigh(0), weigh(22)], intake: const [], today: today),
        isNull,
        reason: 'the weigh-in closes it',
      );
    });

    test('nothing ever recorded is not a gap', () {
      expect(
        openGap(weights: const [], intake: const [], today: start),
        isNull,
      );
    });
  });

  group('the deficit count', () {
    test('restarts after a gap of two weeks or more', () {
      final today = start.addDays(7 * 11 + 16 + 3);
      final history = [record(0)];
      expect(consecutiveDeficitWeeks(history, today), 13);
      expect(
        consecutiveDeficitWeeks(history, today, restartOn: today.addDays(-3)),
        0,
      );
    });

    test('a restart before the deficit began changes nothing', () {
      final history = [record(0, rate: 0), record(30)];
      final today = start.addDays(58);
      expect(
        consecutiveDeficitWeeks(history, today, restartOn: start.addDays(10)),
        4,
      );
    });
  });

  group('the starting estimate after a gap', () {
    List<WeightTrendPoint> trend(Map<int, double> levels) => [
      for (final e in levels.entries)
        WeightTrendPoint(
          date: start.addDays(e.key),
          levelKg: e.value,
          slopeKgPerDay: 0,
          waterKg: 0,
          levelVariance: 0.1,
          slopeVariance: 0.001,
          observed: true,
          rejected: false,
        ),
    ];
    double resting(double kg) => 10 * kg + 800;

    TdeePrior? prior({
      required int gapDays,
      double weightAfter = 85,
      List<TargetsRecord>? history,
    }) {
      final gap = ActivityGap(
        from: start.addDays(40),
        to: start.addDays(39 + gapDays),
      );
      final asOf = gap.to.addDays(3);
      return gapPrior(
        gaps: [gap],
        history: history ?? [record(20)],
        trend: trend({39: 85, 40 + gapDays + 2: weightAfter}),
        asOf: asOf,
        windowDays: 28,
        profileRevision: 0,
        restingEnergyAt: resting,
      );
    }

    test('a three-week gap keeps the usual prior', () {
      expect(prior(gapDays: 21), isNull);
    });

    test('a two-month gap starts from the last measurement, widened', () {
      final p = prior(gapDays: 60)!;
      expect(p.kcal, 2700);
      expect(p.sigmaKcal, closeTo(270, 1e-9));
    });

    test('an already wide uncertainty is not narrowed', () {
      final p = prior(gapDays: 60, history: [record(20, sigma: 400)])!;
      expect(p.sigmaKcal, 400);
    });

    test('weight up 6% rescales it by the change in resting energy', () {
      final p = prior(gapDays: 40, weightAfter: 85 * 1.06)!;
      expect(p.kcal, closeTo(2700 + 10 * 85 * 0.06, 1e-6));
    });

    test('a big weight change rescales after a short gap too', () {
      expect(prior(gapDays: 10, weightAfter: 85 * 0.93), isNotNull);
    });

    test('with no measured expenditure before the gap there is none', () {
      expect(
        prior(gapDays: 60, history: [record(20, status: TdeeStatus.held)]),
        isNull,
      );
    });

    test('a gap that ended before the window is forgotten', () {
      final gap = ActivityGap(from: start.addDays(40), to: start.addDays(99));
      expect(
        gapPrior(
          gaps: [gap],
          history: [record(20)],
          trend: trend({39: 85, 140: 85}),
          asOf: start.addDays(140),
          windowDays: 28,
          profileRevision: 0,
          restingEnergyAt: resting,
        ),
        isNull,
      );
    });
  });

  test('analysis reports the break from the deficit', () {
    final setup = UserSetup(
      profile: Profile(
        sex: BiologicalSex.male,
        birthDate: CalendarDate(1990, 1, 1),
        heightCm: 180,
      ),
      screening: const ScreeningAnswers(),
      trainingStatus: TrainingStatus.intermediate,
      trainingDaysPerWeek: 3,
      dailyActivity: DailyActivity.values.first,
      goalMode: GoalMode.fatLoss,
      onboardedOn: start,
      unitSystem: UnitSystem.metric,
    );
    final today = start.addDays(40);
    final snapshot = analyze(
      setup: setup,
      weights: [for (var i = 0; i < 20; i++) weigh(i), weigh(40)],
      intake: [for (var i = 0; i < 20; i++) ate(i)],
      today: today,
    )!;
    expect(snapshot.gaps.single.days, 20);
    expect(snapshot.deficitRestartOn, today);
  });
}
