import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'support/coach_loop.dart';
import 'support/synthetic_user.dart';
import 'support/week_result.dart';

/// End-to-end behaviour of the weekly coaching loop against simulated users
/// whose true physiology the engine never sees.
void main() {
  final profile = Profile(
    sex: BiologicalSex.male,
    birthDate: CalendarDate(1994, 3, 1),
    heightCm: 180,
  );

  double realizedWeeklyLossFraction(List<WeekResult> r, int from, int to) {
    final start = r[from].trueWeightKg;
    final end = r[to].trueWeightKg;
    return (start - end) / start / (to - from);
  }

  void expectSafeSteps(List<WeekResult> results) {
    for (var w = 1; w < results.length; w++) {
      final step = (results[w].targets.kcal - results[w - 1].targets.kcal)
          .abs();
      expect(step, lessThanOrEqualTo(100 + 1e-9), reason: 'week $w step');
      expect(results[w].targets.kcal, greaterThanOrEqualTo(1500));
    }
  }

  for (final seed in [21, 22, 23]) {
    test('biased, sloppy logger still loses at about the target pace '
        '(seed $seed)', () {
      final user = SyntheticUser(
        seed: seed,
        baseTdeeKcal: 3000, // The formula prior underestimates this user.
        startWeightKg: 92,
        bodyFatPercent: 26,
        underReportFraction: 0.20,
        partialLogProbability: 0.10,
        skipLogProbability: 0.10,
      );
      final results = runCoachLoop(
        user: user,
        profile: profile,
        mode: GoalMode.fatLoss,
        weeks: 16,
      );
      expectSafeSteps(results);

      // Target is 0.75%/week. After the engine converges, the realized true
      // loss must land in a safe, effective band.
      final pace = realizedWeeklyLossFraction(results, 6, 15);
      expect(pace, inInclusiveRange(0.004, 0.0105));

      // The estimate tracks maintenance in logging units.
      final last = results.last;
      expect(
        last.tdee.kcal,
        closeTo(last.trueTdeeKcal * (1 - last.underReportFraction), 250),
      );
    });
  }

  test('no death spiral when logging quality collapses', () {
    final user = SyntheticUser(
      seed: 31,
      baseTdeeKcal: 2700,
      startWeightKg: 88,
      underReportFraction: 0.10,
    );
    final results = runCoachLoop(
      user: user,
      profile: profile,
      mode: GoalMode.fatLoss,
      weeks: 14,
      beforeWeek: (week, u) {
        // From week 6, the user logs only part of most days and never
        // marks them, the pattern that starves naive adaptive engines.
        if (week >= 6) u.partialLogProbability = 0.6;
      },
    );
    expectSafeSteps(results);

    final healthy = results[6].targets.kcal;
    final degraded = results.last.targets.kcal;
    // Targets may drift, but must not ratchet down toward starvation.
    expect(healthy - degraded, lessThan(250));
  });

  test('flat-weight recomp keeps intake near maintenance', () {
    final user = SyntheticUser(
      seed: 41,
      baseTdeeKcal: 2600,
      startWeightKg: 80,
      bodyFatPercent: 18,
    );
    final results = runCoachLoop(
      user: user,
      profile: profile,
      mode: GoalMode.recomp,
      weeks: 10,
      trainingStatus: TrainingStatus.novice,
    );
    expectSafeSteps(results);
    final last = results.last;
    expect(last.targets.kcal, closeTo(last.trueTdeeKcal, 300));
  });
}
