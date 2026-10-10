import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-148: a pause is a planned break, and nothing in it is judged.
void main() {
  final start = CalendarDate(2026, 1, 1);
  WeightObservation weigh(int day, [double kg = 85]) =>
      WeightObservation(date: start.addDays(day), weightKg: kg);
  IntakeDay ate(
    int day, {
    double kcal = 2200,
    DayCompleteness completeness = DayCompleteness.unmarked,
  }) => IntakeDay(
    date: start.addDays(day),
    kcal: kcal,
    proteinG: 150,
    carbsG: 220,
    fatG: 70,
    completeness: completeness,
  );
  Pause pause(int from, int to, {PauseReason reason = PauseReason.travel}) =>
      Pause(from: start.addDays(from), to: start.addDays(to), reason: reason);

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

  TargetsRecord record(int day, {double rate = -0.005}) => TargetsRecord(
    effectiveFrom: start.addDays(day),
    targets: DailyTargets(
      kcal: 2200,
      proteinG: 160,
      fatG: 70,
      carbsG: 220,
      weeklyRateFraction: rate,
    ),
    mode: GoalMode.fatLoss,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 150,
    tdeeStatus: TdeeStatus.updated,
  );

  group('a pause', () {
    test('covers its first and last day and nothing outside them', () {
      final p = pause(10, 20);
      expect(p.days, 11);
      expect(pauseOn([p], start.addDays(9)), isNull);
      expect(pauseOn([p], start.addDays(10)), p);
      expect(pauseOn([p], start.addDays(20)), p);
      expect(pauseOn([p], start.addDays(21)), isNull);
      expect(p.resumesOn, start.addDays(21));
    });

    test('is never a gap, however little was recorded in it', () {
      final today = start.addDays(21);
      expect(
        activityGaps(
          weights: [weigh(9)],
          intake: const [],
          today: today,
          pauses: [pause(10, 20)],
        ),
        isEmpty,
      );
      expect(
        openGap(
          weights: [weigh(9)],
          intake: const [],
          today: today,
          pauses: [pause(10, 20)],
        ),
        isNull,
      );
    });

    test('days away after it ends do become a gap', () {
      final gaps = activityGaps(
        weights: [weigh(9)],
        intake: const [],
        today: start.addDays(30),
        pauses: [pause(10, 20)],
      );
      expect(gaps.single.from, start.addDays(21));
    });

    test('a scheduled pause is not activity before it starts', () {
      final gaps = activityGaps(
        weights: [weigh(0)],
        intake: const [],
        today: start.addDays(10),
        pauses: [pause(20, 30)],
      );
      expect(gaps.single.days, 9);
    });
  });

  group('the estimator', () {
    test('leaves paused days out', () {
      final intake = [for (var i = 0; i < 30; i++) ate(i)];
      final kept = withoutPausedDays(intake, [
        pause(10, 19),
      ], keepComplete: true);
      expect(kept, hasLength(20));
      expect(kept.any((d) => pause(10, 19).covers(d.date)), isFalse);
    });

    test('keeps paused days that were marked complete', () {
      final intake = [
        for (var i = 0; i < 30; i++)
          ate(
            i,
            completeness: i >= 10 && i < 15
                ? DayCompleteness.complete
                : DayCompleteness.unmarked,
          ),
      ];
      final kept = withoutPausedDays(intake, [
        pause(10, 19),
      ], keepComplete: true);
      expect(kept, hasLength(25));
    });

    test('nothing that judges a day sees a paused one, complete or not', () {
      final intake = [
        for (var i = 0; i < 30; i++)
          ate(i, completeness: DayCompleteness.complete),
      ];
      expect(
        withoutPausedDays(intake, [pause(10, 19)], keepComplete: false),
        hasLength(20),
      );
    });

    test('analysis uses fewer days when ten of them were paused', () {
      final weights = [for (var i = 0; i <= 30; i++) weigh(i)];
      final intake = [for (var i = 0; i < 30; i++) ate(i)];
      final today = start.addDays(30);
      final plain = analyze(
        setup: setup,
        weights: weights,
        intake: intake,
        today: today,
      )!;
      final paused = analyze(
        setup: setup,
        weights: weights,
        intake: intake,
        today: today,
        pauses: [pause(15, 24)],
      )!;
      expect(plain.tdee.usableIntakeDays - paused.tdee.usableIntakeDays, 10);
    });
  });

  group('the unbroken-deficit count', () {
    test('restarts after a pause of a week or more', () {
      final today = start.addDays(9 * 7 + 10);
      expect(pauseDeficitRestartOn([pause(63, 72)], today), today);
      final snapshot = analyze(
        setup: setup,
        weights: [for (var i = 0; i <= 73; i++) weigh(i)],
        intake: [for (var i = 0; i < 63; i++) ate(i)],
        history: [record(0)],
        today: today,
        pauses: [pause(63, 72)],
      )!;
      expect(snapshot.deficitRestartOn, today);
      expect(
        consecutiveDeficitWeeks(
          [record(0)],
          today,
          restartOn: snapshot.deficitRestartOn,
        ),
        0,
      );
    });

    test('does not restart for a pause of six days', () {
      expect(pauseDeficitRestartOn([pause(10, 15)], start.addDays(30)), isNull);
    });

    test('does not restart for a pause that has not started', () {
      expect(pauseDeficitRestartOn([pause(40, 60)], start.addDays(30)), isNull);
    });

    test('restarts on the seventh day of a pause still running', () {
      expect(pauseDeficitRestartOn([pause(10, 30)], start.addDays(15)), isNull);
      expect(
        pauseDeficitRestartOn([pause(10, 30)], start.addDays(16)),
        start.addDays(16),
      );
    });
  });

  group('illness and injury', () {
    test('an illness pause records illness events across its days', () {
      final events = pauseWeightEvents(
        pause(10, 19, reason: PauseReason.illness),
      );
      expect(
        [for (final e in events) e.date],
        [start.addDays(10), start.addDays(17)],
      );
      expect(events.every((e) => e.type == WeightEventType.illness), isTrue);
    });

    test('an injury pause records an event too', () {
      expect(
        pauseWeightEvents(pause(10, 12, reason: PauseReason.injury)),
        hasLength(1),
      );
    });

    test('travel records none', () {
      expect(pauseWeightEvents(pause(10, 19)), isEmpty);
    });
  });

  group('the check-in', () {
    CoachSnapshot snapshotOn(CalendarDate today, List<Pause> pauses) => analyze(
      setup: setup,
      weights: [for (var i = 0; i <= start.daysUntil(today); i++) weigh(i)],
      intake: [for (var i = 0; i < start.daysUntil(today); i++) ate(i)],
      history: [record(0)],
      today: today,
      pauses: pauses,
    )!;

    test('does not run during a pause, even for a goal change', () {
      final today = start.addDays(45);
      final pauses = [pause(40, 50)];
      expect(
        nextTargets(
          setup: setup.copyWith(goalMode: GoalMode.maintenance),
          snapshot: snapshotOn(today, pauses),
          history: [record(0)],
          today: today,
          pauses: pauses,
        ),
        isNull,
      );
    });

    test('waits seven days after a pause ends', () {
      final pauses = [pause(40, 50)];
      TargetsRecord? on(int day) => nextTargets(
        setup: setup,
        snapshot: snapshotOn(start.addDays(day), pauses),
        history: [record(0)],
        today: start.addDays(day),
        pauses: pauses,
      );
      expect(on(51), isNull);
      expect(on(57), isNull);
      expect(on(58), isNotNull);
    });

    test('first targets are still issued to someone who starts paused', () {
      final today = start.addDays(3);
      expect(
        nextTargets(
          setup: setup,
          snapshot: snapshotOn(today, [pause(0, 10)]),
          history: const [],
          today: today,
          pauses: [pause(0, 10)],
        ),
        isNotNull,
      );
    });
  });

  group('resuming', () {
    test('is due once a pause has ended, until a weigh-in is saved', () {
      final today = start.addDays(21);
      final p = pause(10, 20);
      expect(pauseToResume(pauses: [p], weights: [weigh(9)], today: today), p);
      expect(
        pauseToResume(
          pauses: [p],
          weights: [weigh(9), weigh(21)],
          today: today,
        ),
        isNull,
      );
    });

    test('is not due while a pause is running', () {
      expect(
        pauseToResume(
          pauses: [pause(10, 20)],
          weights: [weigh(9)],
          today: start.addDays(20),
        ),
        isNull,
      );
    });

    test('a weigh-in during the pause does not count as the one after', () {
      expect(
        pauseToResume(
          pauses: [pause(10, 20)],
          weights: [weigh(15)],
          today: start.addDays(21),
        ),
        isNotNull,
      );
    });
  });

  test('the guide during a pause is maintenance, whatever the goal', () {
    final today = start.addDays(30);
    final snapshot = analyze(
      setup: setup,
      weights: [for (var i = 0; i <= 30; i++) weigh(i)],
      intake: [for (var i = 0; i < 30; i++) ate(i)],
      today: today,
    )!;
    final guide = pausedGuide(setup: setup, snapshot: snapshot);
    expect(guide.weeklyRateFraction, 0);
    expect(guide.kcal, closeTo(snapshot.tdee.kcal, 1));
    final gaining = pausedGuide(
      setup: setup.copyWith(goalMode: GoalMode.leanGain),
      snapshot: snapshot,
    );
    expect(gaining.kcal, guide.kcal);
  });

  test('paused days are counted once where pauses overlap', () {
    expect(
      pausedDaysBetween(
        [pause(0, 9), pause(5, 14), pause(100, 110)],
        start,
        start.addDays(119),
      ),
      26,
    );
    expect(
      pausedDaysBetween([pause(0, 9)], start.addDays(5), start.addDays(30)),
      5,
    );
  });
}
