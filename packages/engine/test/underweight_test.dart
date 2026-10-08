import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/trend_points.dart';

/// MM-111 in the engine: the pace limit, the end of a deficit, and the body
/// weight the rule is judged on.
void main() {
  final start = CalendarDate(2026, 1, 1);

  UserSetup setup({
    GoalMode mode = GoalMode.fatLoss,
    required CalendarDate onboardedOn,
  }) => UserSetup(
    profile: Profile(
      sex: BiologicalSex.female,
      birthDate: CalendarDate(1992, 4, 20),
      heightCm: 170,
    ),
    screening: const ScreeningAnswers(),
    trainingStatus: TrainingStatus.novice,
    trainingDaysPerWeek: 3,
    goalMode: mode,
    onboardedOn: onboardedOn,
  );

  /// One weigh-in a day for [days] days from [start], at [weightKg] (with an
  /// optional [dip] of one day, in kg, at day [dipDay]).
  List<WeightObservation> weighIns(
    int days,
    double weightKg, {
    int? dipDay,
    double dip = 0,
  }) => [
    for (var d = 0; d < days; d++)
      WeightObservation(
        date: start.addDays(d),
        weightKg: weightKg - (d == dipDay ? dip : 0),
      ),
  ];

  CoachSnapshot snapshot(UserSetup s, List<WeightObservation> weights) =>
      analyze(
        setup: s,
        weights: weights,
        intake: const [],
        today: start.addDays(weights.length),
      )!;

  group('what the engine judges body weight on', () {
    final s = setup(onboardedOn: start);

    test('a sustained weight below BMI 18.5 removes the deficit goals', () {
      // 170 cm and 53 kg is BMI 18.3.
      final snap = snapshot(s, weighIns(21, 53));
      expect(snap.policy.underweight, isTrue);
      expect(snap.recommendation.mode, GoalMode.maintenance);
      expect(snap.recommendation.reason, ModeReason.underweight);
    });

    test('one low reading changes nothing', () {
      // BMI 18.9 is 54.6 kg; one reading of 52.9 kg would be BMI 18.3.
      final snap = snapshot(s, weighIns(21, 54.6, dipDay: 20, dip: 1.7));
      expect(snap.policy.underweight, isFalse);
      expect(snap.policy.allowedModes, contains(GoalMode.fatLoss));
    });

    test('at BMI 24 the rule changes nothing', () {
      final snap = snapshot(s, weighIns(21, 69.4));
      expect(snap.policy.underweight, isFalse);
      expect(snap.policy.maxWeeklyLossFraction, isNull);
    });
  });

  group('targets', () {
    TargetInputs inputs({
      required CoachingPolicy policy,
      GoalMode mode = GoalMode.fatLoss,
      DailyTargets? previous,
    }) => TargetInputs(
      sex: BiologicalSex.female,
      heightCm: 170,
      trendWeightKg: 62,
      bodyFat: const BodyFatEstimate(percent: 30, sigmaPercent: 3),
      mode: mode,
      trainingStatus: TrainingStatus.novice,
      policy: policy,
      tdeeKcal: 2300,
      bmrKcal: 1400,
      previous: previous,
    );

    CoachingPolicy policyAt(double weightKg) => CoachingPolicy.derive(
      profile: Profile(
        sex: BiologicalSex.female,
        birthDate: CalendarDate(1992, 4, 20),
        heightCm: 170,
      ),
      screening: const ScreeningAnswers(),
      today: start,
      weightKg: weightKg,
    );

    test('in the caution zone fat loss runs at no more than 0.5% a week', () {
      // 170 cm and 57 kg is BMI 19.7.
      final t = computeTargets(inputs(policy: policyAt(57)));
      expect(t.weeklyRateFraction, closeTo(-0.005, 1e-12));
      final normal = computeTargets(inputs(policy: policyAt(70)));
      expect(normal.weeklyRateFraction, closeTo(-0.0075, 1e-12));
    });

    test('a deficit becomes maintenance at once, flagged and not '
        'step-limited', () {
      final deficit = computeTargets(inputs(policy: policyAt(70)));
      final t = computeTargets(inputs(policy: policyAt(53), previous: deficit));
      expect(t.weeklyRateFraction, 0);
      expect(t.flags, contains(TargetFlag.underweightMaintenance));
      expect(t.flags, isNot(contains(TargetFlag.rateLimited)));
      expect(t.kcal - deficit.kcal, greaterThan(100));
    });
  });

  group('check-in', () {
    test('a deficit ends at the next check-in, even during calibration', () {
      final s = setup(onboardedOn: start.addDays(20));
      final snap = snapshot(s, weighIns(28, 53));
      final first = TargetsRecord(
        effectiveFrom: start,
        mode: GoalMode.fatLoss,
        tdeeKcal: 1850,
        tdeeSigmaKcal: 250,
        tdeeStatus: TdeeStatus.held,
        targets: const DailyTargets(
          kcal: 1450,
          proteinG: 110,
          fatG: 50,
          carbsG: 170,
          weeklyRateFraction: -0.0075,
        ),
      );
      final next = nextTargets(
        setup: s,
        snapshot: snap,
        history: [first],
        today: start.addDays(28),
      );
      expect(next, isNotNull, reason: 'calibration does not delay this');
      expect(next!.mode, GoalMode.maintenance);
      expect(next.targets.weeklyRateFraction, 0);
      expect(next.targets.flags, contains(TargetFlag.underweightMaintenance));
      expect(next.targets.kcal - first.targets.kcal, greaterThan(100));
    });

    test('not before the weekly check-in is due', () {
      final s = setup(onboardedOn: start.addDays(20));
      final snap = snapshot(s, weighIns(28, 53));
      expect(
        nextTargets(
          setup: s,
          snapshot: snap,
          history: [deficitStartingOn(start.addDays(25))],
          today: start.addDays(28),
        ),
        isNull,
      );
    });

    test('a forced maintenance record is not rewritten every check-in while '
        'the stored goal is still a deficit', () {
      final s = setup(onboardedOn: start.addDays(20));
      final snap = snapshot(s, weighIns(35, 53));
      final forced = TargetsRecord(
        effectiveFrom: start.addDays(28),
        mode: GoalMode.maintenance,
        tdeeKcal: 1850,
        tdeeSigmaKcal: 250,
        tdeeStatus: TdeeStatus.held,
        targets: const DailyTargets(
          kcal: 1850,
          proteinG: 110,
          fatG: 55,
          carbsG: 230,
          weeklyRateFraction: 0,
          flags: {TargetFlag.underweightMaintenance},
        ),
      );
      expect(
        nextTargets(
          setup: s,
          snapshot: snap,
          history: [forced],
          today: start.addDays(30),
        ),
        isNull,
      );
    });

    test('a user already at maintenance is left alone', () {
      final s = setup(
        mode: GoalMode.maintenance,
        onboardedOn: start.addDays(20),
      );
      final snap = snapshot(s, weighIns(28, 53));
      final maintenance = TargetsRecord(
        effectiveFrom: start,
        mode: GoalMode.maintenance,
        tdeeKcal: 2400,
        tdeeSigmaKcal: 300,
        tdeeStatus: TdeeStatus.held,
        targets: const DailyTargets(
          kcal: 2400,
          proteinG: 110,
          fatG: 70,
          carbsG: 300,
          weeklyRateFraction: 0,
        ),
      );
      // Calibration still holds the ordinary path, so nothing changes.
      expect(
        nextTargets(
          setup: s,
          snapshot: snap,
          history: [maintenance],
          today: start.addDays(28),
        ),
        isNull,
      );
    });
  });
}
