import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/trend_points.dart';

void main() {
  final today = CalendarDate(2026, 3, 1);
  final setup = UserSetup(
    profile: Profile(
      sex: BiologicalSex.male,
      birthDate: CalendarDate(1994, 3, 1),
      heightCm: 180,
    ),
    screening: const ScreeningAnswers(),
    trainingStatus: TrainingStatus.intermediate,
    trainingDaysPerWeek: 3,
    goalMode: GoalMode.fatLoss,
    onboardedOn: today.addDays(-60),
  );

  TargetsRecord previous({int rulesVersion = currentTargetRulesVersion}) =>
      TargetsRecord(
        effectiveFrom: today.addDays(-28),
        mode: GoalMode.fatLoss,
        tdeeKcal: 2800,
        tdeeSigmaKcal: 200,
        tdeeStatus: TdeeStatus.updated,
        targetRulesVersion: rulesVersion,
        targets: const DailyTargets(
          kcal: 2300,
          proteinG: 160,
          fatG: 70,
          carbsG: 250,
          weeklyRateFraction: -0.0075,
        ),
      );

  CoachSnapshot snapshot({
    CalendarDate? eventOn,
    double tdeeKcal = 2300,
    double lossFraction = 0,
  }) => CoachSnapshot(
    policy: CoachingPolicy.derive(
      profile: setup.profile,
      screening: setup.screening,
      today: today,
    ),
    trend: trendOf(
      start: today.addDays(-21),
      levelKg: 85,
      lossFractionPerWeek: lossFraction,
    ),
    trendWeightKg: 85,
    bodyFat: const BodyFatEstimate(percent: 25, sigmaPercent: 2),
    bmrKcal: 1800,
    tdee: TdeeEstimate(
      kcal: tdeeKcal,
      sigmaKcal: 200,
      status: TdeeStatus.updated,
      usableIntakeDays: 28,
      excludedPartialDays: 0,
      weighIns: 28,
    ),
    confidence: const CoachConfidence(
      level: ConfidenceLevel.fair,
      estimate: ConfidenceLevel.good,
      foodLog: ConfidenceLevel.good,
      weighIns: ConfidenceLevel.good,
      stability: ConfidenceLevel.fair,
      nextStep: ConfidenceNextStep.waitForStability,
      usableFoodDays: 28,
      weighInDays: 28,
    ),
    recommendation: const ModeRecommendation(
      GoalMode.fatLoss,
      ModeReason.cutFirst,
    ),
    lastCreatineEventOn: eventOn,
  );

  for (final daysAgo in [0, 7, 28]) {
    test('ordinary reduction is paused $daysAgo days after creatine', () {
      expect(
        nextTargets(
          setup: setup,
          snapshot: snapshot(eventOn: today.addDays(-daysAgo)),
          history: [previous()],
          today: today,
        ),
        isNull,
      );
    });
  }

  for (final eventOn in [null, today.addDays(-29), today.addDays(1)]) {
    test('ordinary reduction resumes outside the pause ($eventOn)', () {
      final last = previous();
      final next = nextTargets(
        setup: setup,
        snapshot: snapshot(eventOn: eventOn),
        history: [last],
        today: today,
      );
      expect(next, isNotNull);
      expect(next!.targets.kcal, lessThan(last.targets.kcal));
    });
  }

  test('an ordinary raise still applies during the creatine pause', () {
    final last = previous();
    final next = nextTargets(
      setup: setup,
      snapshot: snapshot(eventOn: today, tdeeKcal: 3400),
      history: [last],
      today: today,
    );
    expect(next, isNotNull);
    expect(next!.targets.kcal, greaterThan(last.targets.kcal));
  });

  test('a safe-pace raise still applies during the creatine pause', () {
    final next = nextTargets(
      setup: setup,
      snapshot: snapshot(eventOn: today, lossFraction: 0.015),
      history: [previous()],
      today: today,
    );
    expect(next, isNotNull);
    expect(next!.targets.flags, contains(TargetFlag.raisedForSafePace));
    expect(next.targets.kcal, greaterThan(previous().targets.kcal));
  });

  test('explicit goal changes still apply during the creatine pause', () {
    final next = nextTargets(
      setup: setup.copyWith(goalMode: GoalMode.maintenance),
      snapshot: snapshot(eventOn: today),
      history: [previous()],
      today: today,
    );
    expect(next, isNotNull);
    expect(next!.mode, GoalMode.maintenance);
  });

  test('profile corrections can reduce calories during the pause', () {
    final next = nextTargets(
      setup: setup.copyWith(profileRevision: 1),
      snapshot: snapshot(eventOn: today),
      history: [previous()],
      today: today,
    );
    expect(next, isNotNull);
    expect(next!.targets.kcal, lessThan(previous().targets.kcal));
    expect(next.profileRevision, 1);
  });

  test('target-rule corrections still apply during the pause', () {
    final next = nextTargets(
      setup: setup,
      snapshot: snapshot(eventOn: today),
      history: [previous(rulesVersion: currentTargetRulesVersion - 1)],
      today: today,
    );
    expect(next, isNotNull);
    expect(next!.targetRulesVersion, currentTargetRulesVersion);
  });
}
