import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-117: an offer to ease a deficit when recovery is failing.
void main() {
  final today = CalendarDate(2026, 10, 5);

  UserSetup setup({
    GoalMode goal = GoalMode.fatLoss,
    double? pace,
    CalendarDate? answeredOn,
    CalendarDate? breakFrom,
  }) => UserSetup(
    profile: Profile(
      sex: BiologicalSex.male,
      birthDate: CalendarDate(1990, 1, 1),
      heightCm: 180,
    ),
    screening: const ScreeningAnswers(),
    trainingStatus: TrainingStatus.intermediate,
    trainingDaysPerWeek: 3,
    goalMode: goal,
    onboardedOn: today.addDays(-200),
    requestedLossFraction: pace,
    reliefAnsweredOn: answeredOn,
    maintenanceWeekFrom: breakFrom,
  );

  TargetsRecord record(int daysAgo, {double rate = -0.0075}) => TargetsRecord(
    effectiveFrom: today.addDays(-daysAgo),
    targets: DailyTargets(
      kcal: 2100,
      proteinG: 160,
      fatG: 70,
      carbsG: 200,
      weeklyRateFraction: rate,
    ),
    mode: GoalMode.fatLoss,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 150,
    tdeeStatus: TdeeStatus.updated,
  );

  /// Hunger, energy and sleep at the hard end; training and mood fine.
  RecoveryCheckIn hard(int daysAgo, {double? sleepHours}) => RecoveryCheckIn(
    date: today.addDays(-daysAgo),
    hunger: 1,
    energy: 2,
    sleep: 2,
    training: 4,
    mood: 3,
    sleepHours: sleepHours,
  );
  RecoveryCheckIn fine(int daysAgo) => RecoveryCheckIn(
    date: today.addDays(-daysAgo),
    hunger: 3,
    energy: 4,
    sleep: 2,
    training: 2,
    mood: 4,
  );

  ReliefOffer? offer({
    UserSetup? user,
    List<RecoveryCheckIn>? checkIns,
    List<TargetsRecord>? history,
    Iterable<Pause> pauses = const [],
  }) => findReliefOffer(
    setup: user ?? setup(),
    checkIns: checkIns ?? [hard(8), hard(1)],
    history: history ?? [record(21)],
    today: today,
    pauses: pauses,
  );

  test('two hard check-ins running on a deficit make the offer', () {
    expect(offer(), isNotNull);
  });

  test('one hard check-in does not', () {
    expect(offer(checkIns: [hard(1)]), isNull);
    expect(offer(checkIns: [fine(8), hard(1)]), isNull);
    expect(offer(checkIns: [hard(8), fine(1)]), isNull);
  });

  test('two answers at the hard end are not enough for a check-in', () {
    expect(offer(checkIns: [fine(8), fine(1)]), isNull);
  });

  test('old check-ins do not count', () {
    expect(offer(checkIns: [hard(15), hard(8)]), isNull, reason: 'stale');
    expect(offer(checkIns: [hard(40), hard(1)]), isNull, reason: 'not running');
  });

  test('the same week answered twice is one check-in', () {
    expect(offer(checkIns: [hard(2), hard(1)]), isNull);
    expect(offer(checkIns: [hard(6), hard(1)]), isNotNull);
  });

  test('is not made on lean gain or maintenance', () {
    expect(offer(user: setup(goal: GoalMode.leanGain)), isNull);
    expect(offer(user: setup(goal: GoalMode.maintenance)), isNull);
  });

  test('is not made while the targets are already at maintenance', () {
    expect(offer(history: [record(21), record(2, rate: 0)]), isNull);
  });

  test('is made on recomp, with no slower pace to offer', () {
    final found = offer(user: setup(goal: GoalMode.recomp))!;
    expect(found.slowerPace, isNull);
    expect(found.suggestion, ReliefChoice.maintenanceWeek);
  });

  test('after any answer it is quiet for three weeks', () {
    expect(offer(user: setup(answeredOn: today.addDays(-20))), isNull);
    expect(offer(user: setup(answeredOn: today.addDays(-21))), isNotNull);
  });

  test('is not made during a pause', () {
    expect(
      offer(
        pauses: [
          Pause(
            from: today.addDays(-1),
            to: today.addDays(3),
            reason: PauseReason.illness,
          ),
        ],
      ),
      isNull,
    );
  });

  group('what the coach would pick', () {
    test('early in a deficit, the slower pace', () {
      final found = offer(history: [record(21)])!;
      expect(found.deficitWeeks, 3);
      expect(found.suggestion, ReliefChoice.slowerPace);
      expect(found.slowerPace, 0.005);
    });

    test('eight weeks in, the maintenance week', () {
      final found = offer(history: [record(63)])!;
      expect(found.deficitWeeks, 9);
      expect(found.suggestion, ReliefChoice.maintenanceWeek);
      expect(found.slowerPace, 0.005, reason: 'still offered');
    });

    test('already at the gentlest pace, the maintenance week', () {
      final found = offer(user: setup(pace: 0.005))!;
      expect(found.slowerPace, isNull);
      expect(found.suggestion, ReliefChoice.maintenanceWeek);
    });
  });

  test('a slower pace is one step gentler and never faster', () {
    expect(slowerPace(0.01), 0.0075);
    expect(slowerPace(null), 0.005);
    expect(slowerPace(0.0075), 0.005);
    expect(slowerPace(0.005), isNull);
    expect(slowerPace(0.004), isNull);
  });

  test('short sleep adds a line and is never a trigger', () {
    expect(
      offer(checkIns: [hard(8, sleepHours: 5.5), hard(1, sleepHours: 6)])!
          .shortSleep,
      isTrue,
    );
    expect(
      offer(checkIns: [hard(8, sleepHours: 7), hard(1, sleepHours: 7)])!
          .shortSleep,
      isFalse,
    );
    expect(offer()!.shortSleep, isFalse, reason: 'no hours given');
    expect(
      offer(
        checkIns: [
          RecoveryCheckIn(
            date: today.addDays(-8),
            hunger: 4,
            energy: 4,
            sleep: 1,
            training: 4,
            mood: 4,
            sleepHours: 4,
          ),
          RecoveryCheckIn(
            date: today.addDays(-1),
            hunger: 4,
            energy: 4,
            sleep: 1,
            training: 4,
            mood: 4,
            sleepHours: 4,
          ),
        ],
      ),
      isNull,
    );
  });

  group('a maintenance week the user takes', () {
    final start = today.addDays(-70);
    final user = UserSetup(
      profile: Profile(
        sex: BiologicalSex.male,
        birthDate: CalendarDate(1990, 1, 1),
        heightCm: 180,
      ),
      screening: const ScreeningAnswers(),
      trainingStatus: TrainingStatus.intermediate,
      trainingDaysPerWeek: 3,
      goalMode: GoalMode.fatLoss,
      onboardedOn: start,
      unitSystem: UnitSystem.metric,
    );
    CoachSnapshot snapshotOn(CalendarDate day) => analyze(
      setup: user,
      weights: [
        for (var i = 0; i <= start.daysUntil(day); i++)
          WeightObservation(date: start.addDays(i), weightKg: 90 - i * 0.07),
      ],
      intake: [
        for (var i = 0; i < start.daysUntil(day); i++)
          IntakeDay(
            date: start.addDays(i),
            kcal: 2100,
            proteinG: 160,
            carbsG: 200,
            fatG: 70,
          ),
      ],
      today: day,
    )!;
    // The last check-in was three days ago, so an ordinary one is not due.
    final history = [record(3)];

    test('starts at once, at maintenance, beyond the weekly step', () {
      expect(
        nextTargets(
          setup: user,
          snapshot: snapshotOn(today),
          history: history,
          today: today,
        ),
        isNull,
        reason: 'nothing is due without it',
      );
      final next = nextTargets(
        setup: user.copyWith(maintenanceWeekFrom: today),
        snapshot: snapshotOn(today),
        history: history,
        today: today,
      )!;
      expect(next.targets.flags, contains(TargetFlag.requestedBreak));
      expect(next.targets.weeklyRateFraction, 0);
      expect(next.targets.kcal, greaterThan(history.last.targets.kcal));
      expect(next.targets.kcal, closeTo(snapshotOn(today).tdee.kcal, 1));
      expect(
        next.explanation!.lines.map((l) => l.reason),
        contains(ExplanationReason.requestedBreak),
      );
    });

    test('is issued once, and holds for the week', () {
      final taken = user.copyWith(maintenanceWeekFrom: today);
      final first = nextTargets(
        setup: taken,
        snapshot: snapshotOn(today),
        history: history,
        today: today,
      )!;
      for (var day = 0; day < 7; day++) {
        expect(
          nextTargets(
            setup: taken,
            snapshot: snapshotOn(today.addDays(day)),
            history: [...history, first],
            today: today.addDays(day),
          ),
          isNull,
          reason: 'day $day',
        );
      }
    });

    test('ends the unbroken deficit, and the deficit resumes after it', () {
      final taken = user.copyWith(maintenanceWeekFrom: today);
      final first = nextTargets(
        setup: taken,
        snapshot: snapshotOn(today),
        history: history,
        today: today,
      )!;
      final after = today.addDays(7);
      expect(consecutiveDeficitWeeks([...history, first], after), 0);
      final resumed = nextTargets(
        setup: taken,
        snapshot: snapshotOn(after),
        history: [...history, first],
        today: after,
      )!;
      expect(resumed.targets.weeklyRateFraction, lessThan(0));
      expect(resumed.targets.flags, isNot(contains(TargetFlag.requestedBreak)));
    });

    test('cannot be held back like an ordinary reduction', () {
      expect(TargetFlag.values, contains(TargetFlag.requestedBreak));
      final taken = user.copyWith(maintenanceWeekFrom: today);
      final first = nextTargets(
        setup: taken,
        snapshot: snapshotOn(today),
        history: history,
        today: today,
      )!;
      expect(canHoldReduction([...history, first]), isFalse);
    });
  });
}
