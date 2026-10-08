import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/coach_loop.dart';
import 'support/synthetic_user.dart';

/// MM-138: every change comes with an account that adds up.
void main() {
  final profile = Profile(
    sex: BiologicalSex.male,
    birthDate: CalendarDate(1994, 3, 1),
    heightCm: 180,
  );
  final start = CalendarDate(2026, 1, 1);

  CoachingPolicy policy() => CoachingPolicy.derive(
    profile: profile,
    screening: const ScreeningAnswers(),
    today: start,
  );

  TargetInputs inputs({
    required double tdee,
    GoalMode mode = GoalMode.fatLoss,
    DailyTargets? previous,
    double bmr = 1900,
  }) => TargetInputs(
    sex: BiologicalSex.male,
    heightCm: 180,
    trendWeightKg: 90,
    bodyFat: const BodyFatEstimate(percent: 25, sigmaPercent: 5),
    mode: mode,
    trainingStatus: TrainingStatus.intermediate,
    policy: policy(),
    tdeeKcal: tdee,
    bmrKcal: bmr,
    previous: previous,
  );

  TargetsRecord recordOf(DailyTargets t, double tdee) => TargetsRecord(
    effectiveFrom: start,
    mode: GoalMode.fatLoss,
    tdeeKcal: tdee,
    tdeeSigmaKcal: 250,
    tdeeStatus: TdeeStatus.updated,
    targets: t,
  );

  TdeeEstimate estimate(double kcal) => TdeeEstimate(
    kcal: kcal,
    sigmaKcal: 250,
    status: TdeeStatus.updated,
    usableIntakeDays: 12,
    excludedPartialDays: 2,
    weighIns: 11,
  );

  ({TargetsExplanation explanation, double change}) explain({
    required double tdeeBefore,
    required double tdeeNow,
    double bmr = 1900,
  }) {
    final before = computeTargets(inputs(tdee: tdeeBefore, bmr: bmr));
    final traced = computeTargetsTraced(
      inputs(tdee: tdeeNow, previous: before, bmr: bmr),
    );
    final explanation = explainTargets(
      trigger: ExplanationTrigger.checkIn,
      previous: recordOf(before, tdeeBefore),
      targets: traced.targets,
      trace: traced.trace,
      tdee: estimate(tdeeNow),
    );
    return (
      explanation: explanation,
      change: traced.targets.kcal - before.kcal,
    );
  }

  double lineKcal(TargetsExplanation e, ExplanationReason r) =>
      e.lines.where((l) => l.reason == r).fold(0.0, (sum, l) => sum + l.kcal);

  test('an ordinary change: the estimate fell and the step limit held back '
      'the rest', () {
    final r = explain(tdeeBefore: 2950, tdeeNow: 2650);
    final e = r.explanation;
    expect(r.change, closeTo(-100, 1e-9), reason: 'limited to 100');
    expect(
      lineKcal(e, ExplanationReason.expenditureEstimate),
      closeTo(-300, 1e-9),
    );
    // The step limit gave back what it held (a positive line).
    expect(lineKcal(e, ExplanationReason.stepLimit), greaterThan(0));
    expect(e.linesTotal, closeTo(r.change, 1e-9));
    expect(e.previousKcal! + e.change!, closeTo(e.newKcal, 1e-9));
    expect(e.usableIntakeDays, 12);
    expect(e.excludedPartialDays, 2);
    expect(e.weighIns, 11);
  });

  test('a floor that held the target up is named, with what it would have '
      'been', () {
    // A high floor (resting energy) against a falling expenditure.
    final r = explain(tdeeBefore: 2300, tdeeNow: 1700, bmr: 2000);
    final floor = r.explanation.lines.firstWhere(
      (l) => l.reason == ExplanationReason.calorieFloor,
    );
    expect(floor.kcal, greaterThan(0));
    expect(floor.from, lessThan(floor.to!));
    expect(floor.to, closeTo(r.explanation.newKcal, 1e-9));
    expect(r.explanation.linesTotal, closeTo(r.change, 1e-9));
  });

  test('a goal change is named as the cause of the rest', () {
    final before = computeTargets(inputs(tdee: 2800));
    final unchanged = computeTargetsTraced(inputs(tdee: 2800));
    final none = explainTargets(
      trigger: ExplanationTrigger.goalChange,
      previous: recordOf(before, 2800),
      targets: unchanged.targets,
      trace: unchanged.trace,
      tdee: estimate(2800),
    );
    expect(none.lines, isEmpty, reason: 'nothing changed');

    final changed = computeTargetsTraced(
      inputs(tdee: 2800, mode: GoalMode.maintenance),
    );
    final e = explainTargets(
      trigger: ExplanationTrigger.goalChange,
      previous: recordOf(before, 2800),
      targets: changed.targets,
      trace: changed.trace,
      tdee: estimate(2800),
    );
    expect(e.lines.single.reason, ExplanationReason.goalChange);
    expect(e.linesTotal, closeTo(changed.targets.kcal - before.kcal, 1e-9));
  });

  test('the first targets have nothing to compare with', () {
    final traced = computeTargetsTraced(inputs(tdee: 2800));
    final e = explainTargets(
      trigger: ExplanationTrigger.firstTargets,
      previous: null,
      targets: traced.targets,
      trace: traced.trace,
      tdee: estimate(2800),
    );
    expect(e.lines.single.reason, ExplanationReason.firstTargets);
    expect(e.previousKcal, isNull);
    expect(e.change, isNull);
  });

  test('it survives being stored as text', () {
    final r = explain(tdeeBefore: 2950, tdeeNow: 2650);
    final back = TargetsExplanation.decode(r.explanation.encode());
    expect(back.newKcal, r.explanation.newKcal);
    expect(back.previousKcal, r.explanation.previousKcal);
    expect(back.estimateStatus, TdeeStatus.updated);
    expect(back.weighIns, 11);
    expect(
      [for (final l in back.lines) (l.reason, l.kcal, l.from, l.to)],
      [for (final l in r.explanation.lines) (l.reason, l.kcal, l.from, l.to)],
    );
  });

  test('over a 16-week simulated run the contributions add up to every '
      'change within 5 kcal', () {
    var changes = 0;
    var withLimits = 0;
    for (var seed = 600; seed < 612; seed++) {
      final user = SyntheticUser(
        seed: seed,
        start: start,
        baseTdeeKcal: 2600 + (seed % 4) * 200,
        startWeightKg: 88,
        bodyFatPercent: 24,
        underReportFraction: (seed % 3) * 0.05,
        skipLogProbability: 0.08,
        glycogenSwingFraction: 0.02,
      );
      final results = runCoachLoop(
        user: user,
        profile: profile,
        mode: GoalMode.fatLoss,
        weeks: 16,
      );
      double? previous;
      for (final w in results) {
        final e = w.explanation;
        if (e != null && e.previousKcal != null) {
          changes++;
          expect(
            (e.linesTotal - e.change!).abs(),
            lessThanOrEqualTo(5),
            reason: 'seed $seed week ${w.week}',
          );
          expect(e.previousKcal, closeTo(previous!, 1e-9));
          if (e.lines.any(
            (l) =>
                l.reason == ExplanationReason.stepLimit ||
                l.reason == ExplanationReason.calorieFloor ||
                l.reason == ExplanationReason.safetyRaise,
          )) {
            withLimits++;
          }
        }
        if (e != null) previous = e.newKcal;
        if (e == null && previous != null) {
          expect(w.targets.kcal, closeTo(previous, 1e-9));
        }
      }
    }
    expect(changes, greaterThan(20));
    expect(withLimits, greaterThan(0), reason: 'the limits are exercised');
  });
}
