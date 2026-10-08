import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/coach_loop.dart';
import 'support/synthetic_user.dart';
import 'support/week_result.dart';

/// MM-115 through the whole weekly loop: simulated users whose true physiology
/// the engine never sees.
void main() {
  final profile = Profile(
    sex: BiologicalSex.male,
    birthDate: CalendarDate(1994, 3, 1),
    heightCm: 180,
  );
  final day0 = CalendarDate(2026, 1, 1);

  double startingEstimate(double weightKg) => initialTdeePrior(
    bmrKcal: mifflinStJeorKcal(
      sex: profile.sex,
      weightKg: weightKg,
      heightCm: profile.heightCm,
      ageYears: profile.ageOn(day0),
    ),
    dailyActivity: DailyActivity.light,
    trainingDaysPerWeek: 3,
  ).kcal;

  double weeklyLoss(List<WeekResult> r, int from, int to) =>
      (r[from].trueWeightKg - r[to].trueWeightKg) /
      r[from].trueWeightKg /
      (to - from);

  bool raised(WeekResult w) =>
      w.targets.flags.contains(TargetFlag.raisedForSafePace);

  // At +400 kcal a 92 kg man loses about 1.0% a week: at his limit, not over
  // it, so nothing is raised. A lighter man with a larger underestimate is
  // over it.
  test('expenditure underestimated by 600 kcal: the target rises past the '
      'weekly step and the loss comes back under the limit', () {
    final firsts = <int>[];
    for (var seed = 500; seed < 520; seed++) {
      final user = SyntheticUser(
        seed: seed,
        start: day0,
        baseTdeeKcal: startingEstimate(80) + 600,
        startWeightKg: 80,
        bodyFatPercent: 25,
        skipLogProbability: 0.05,
        skipWeighInProbability: 0.2,
      );
      final results = runCoachLoop(
        user: user,
        profile: profile,
        mode: GoalMode.fatLoss,
        weeks: 14,
      );
      final first = results.indexWhere(raised);
      expect(first, greaterThan(0), reason: 'seed $seed: a raise was issued');
      firsts.add(first);

      final jump =
          results[first].targets.kcal - results[first - 1].targets.kcal;
      expect(jump, greaterThan(100), reason: 'seed $seed');
      expect(jump, lessThanOrEqualTo(safetyRaiseCapKcal + 1e-9));

      // In the three weeks after the raise the true loss is under 1.0% a week.
      // (It can drift back up later if a noisy expenditure estimate walks the
      // target down again; the rule acts again once that is clear.)
      expect(
        weeklyLoss(results, first, first + 3),
        lessThan(0.010),
        reason: 'seed $seed',
      );
    }
    // The trend needs the days after the settling window before its pace is
    // clear, so a raise comes in the third to eighth week. Measured over
    // these twenty users: first raises in weeks 3 to 8, median 4 to 5.
    firsts.sort();
    expect(firsts.last, lessThanOrEqualTo(9));
    expect(firsts[firsts.length ~/ 2], lessThanOrEqualTo(5));
  });

  test('the same user needs no safety raise when the estimate is right', () {
    final user = SyntheticUser(
      seed: 44,
      start: day0,
      baseTdeeKcal: startingEstimate(80),
      startWeightKg: 80,
      bodyFatPercent: 25,
    );
    final results = runCoachLoop(
      user: user,
      profile: profile,
      mode: GoalMode.fatLoss,
      weeks: 14,
    );
    expect(results.where(raised), isEmpty);
  });

  test('a lean user losing clearly faster than 0.5% a week is raised', () {
    // The formula body-fat estimate puts this man well above 12%, so the
    // engine holds him to 1.0%; give the loop a lean one directly.
    final user = SyntheticUser(
      seed: 45,
      start: day0,
      baseTdeeKcal: startingEstimate(78) + 450,
      startWeightKg: 78,
      bodyFatPercent: 11,
    );
    final results = runCoachLoop(
      user: user,
      profile: profile,
      mode: GoalMode.fatLoss,
      weeks: 14,
      bodyFat: const BodyFatEstimate(percent: 11, sigmaPercent: 3),
    );
    expect(results.where(raised), isNotEmpty);
  });

  test('no oscillation: a raise is not followed by two full-step falls', () {
    var raises = 0;
    for (var seed = 300; seed < 340; seed++) {
      final user = SyntheticUser(
        seed: seed,
        start: day0,
        baseTdeeKcal: startingEstimate(90) + 300 + (seed % 3) * 250,
        startWeightKg: 90,
        bodyFatPercent: 24,
        underReportFraction: 0.1,
        skipLogProbability: 0.1,
        partialLogProbability: 0.05,
        skipWeighInProbability: 0.25,
        glycogenSwingFraction: 0.02,
      );
      final r = runCoachLoop(
        user: user,
        profile: profile,
        mode: GoalMode.fatLoss,
        weeks: 16,
      );
      for (var w = 1; w < r.length - 2; w++) {
        if (!raised(r[w])) continue;
        raises++;
        double step(int i) => r[i].targets.kcal - r[i - 1].targets.kcal;
        final fellFully =
            step(w + 1) <= -100 + 1e-9 && step(w + 2) <= -100 + 1e-9;
        expect(fellFully, isFalse, reason: 'seed $seed, raise in week $w');
      }
    }
    expect(raises, greaterThan(0), reason: 'the scenario exercises the rule');
  });

  test('every step outside a safety raise is still at most 100 kcal', () {
    for (var seed = 50; seed < 56; seed++) {
      final user = SyntheticUser(
        seed: seed,
        start: day0,
        baseTdeeKcal: startingEstimate(88) + 300,
        startWeightKg: 88,
      );
      final r = runCoachLoop(
        user: user,
        profile: profile,
        mode: GoalMode.fatLoss,
        weeks: 14,
      );
      for (var w = 1; w < r.length; w++) {
        if (raised(r[w])) continue;
        expect(
          (r[w].targets.kcal - r[w - 1].targets.kcal).abs(),
          lessThanOrEqualTo(100 + 1e-9),
          reason: 'seed $seed week $w',
        );
      }
    }
  });
}
