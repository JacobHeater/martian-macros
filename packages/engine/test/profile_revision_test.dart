import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-83: a corrected profile or health check issues new targets at once.
void main() {
  final start = CalendarDate(2026, 1, 1);

  UserSetup setup({
    BiologicalSex sex = BiologicalSex.male,
    ScreeningAnswers screening = const ScreeningAnswers(),
    int revision = 0,
    GoalMode mode = GoalMode.fatLoss,
  }) => UserSetup(
    profile: Profile(
      sex: sex,
      birthDate: CalendarDate(1990, 1, 1),
      heightCm: 178,
    ),
    screening: screening,
    trainingStatus: TrainingStatus.intermediate,
    trainingDaysPerWeek: 3,
    goalMode: mode,
    onboardedOn: start,
    profileRevision: revision,
  );

  CoachSnapshot snapshotFor(UserSetup s) => analyze(
    setup: s,
    weights: [
      for (var d = 0; d < 30; d++)
        WeightObservation(date: start.addDays(d), weightKg: 80),
    ],
    intake: const [],
    today: start.addDays(30),
  )!;

  TargetsRecord last({
    required int revision,
    GoalMode mode = GoalMode.fatLoss,
    int rulesVersion = currentTargetRulesVersion,
  }) => TargetsRecord(
    effectiveFrom: start.addDays(29),
    mode: mode,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 250,
    tdeeStatus: TdeeStatus.updated,
    profileRevision: revision,
    targetRulesVersion: rulesVersion,
    safetyBodyFatPercent: 15,
    targets: const DailyTargets(
      kcal: 2200,
      proteinG: 170,
      fatG: 70,
      carbsG: 230,
      weeklyRateFraction: -0.0075,
    ),
  );

  test('a new revision issues targets the next day, with no step limit', () {
    final s = setup(sex: BiologicalSex.female, revision: 1);
    final next = nextTargets(
      setup: s,
      snapshot: snapshotFor(s),
      history: [last(revision: 0)],
      today: start.addDays(30),
    );
    expect(next, isNotNull, reason: 'the weekly wait does not apply');
    expect(next!.profileRevision, 1);
    expect(next.effectiveFrom, start.addDays(30));
    expect(next.targets.flags, isNot(contains(TargetFlag.rateLimited)));
  });

  test('the same revision changes nothing before the check-in is due', () {
    final s = setup(revision: 2);
    expect(
      nextTargets(
        setup: s,
        snapshot: snapshotFor(s),
        history: [last(revision: 2)],
        today: start.addDays(30),
      ),
      isNull,
    );
  });

  test('a target-rules update applies before the next weekly check-in', () {
    final s = setup();
    final next = nextTargets(
      setup: s,
      snapshot: snapshotFor(s),
      history: [last(revision: 0, rulesVersion: currentTargetRulesVersion - 1)],
      today: start.addDays(30),
    );
    expect(next, isNotNull);
    expect(next!.targetRulesVersion, currentTargetRulesVersion);
    expect(
      next.explanation!.lines.map((line) => line.reason),
      contains(ExplanationReason.appRuleUpdate),
    );
  });

  test('the current target-rules version waits for the normal check-in', () {
    final s = setup();
    final next = nextTargets(
      setup: s,
      snapshot: snapshotFor(s),
      history: [last(revision: 0)],
      today: start.addDays(30),
    );
    expect(next, isNull);
  });

  test('a health answer that rules the goal out makes it maintenance, '
      'flagged', () {
    final s = setup(
      sex: BiologicalSex.female,
      screening: const ScreeningAnswers(pregnant: true),
      revision: 1,
    );
    final next = nextTargets(
      setup: s,
      snapshot: snapshotFor(s),
      history: [last(revision: 0)],
      today: start.addDays(30),
    )!;
    expect(next.mode, GoalMode.maintenance);
    expect(next.targets.weeklyRateFraction, 0);
    expect(next.targets.flags, contains(TargetFlag.modeNotAllowed));
  });

  test('once held at maintenance for a health answer, it is not rewritten '
      'while the stored goal is still the old one', () {
    final s = setup(
      sex: BiologicalSex.female,
      screening: const ScreeningAnswers(pregnant: true),
      revision: 1,
    );
    final held = TargetsRecord(
      effectiveFrom: start.addDays(30),
      mode: GoalMode.maintenance,
      tdeeKcal: 2300,
      tdeeSigmaKcal: 250,
      tdeeStatus: TdeeStatus.updated,
      profileRevision: 1,
      safetyBodyFatPercent: 15,
      targets: const DailyTargets(
        kcal: 2300,
        proteinG: 120,
        fatG: 70,
        carbsG: 260,
        weeklyRateFraction: 0,
        flags: {TargetFlag.modeNotAllowed},
      ),
    );
    expect(
      nextTargets(
        setup: s,
        snapshot: snapshotFor(s),
        history: [held],
        today: start.addDays(31),
      ),
      isNull,
    );
  });
}
