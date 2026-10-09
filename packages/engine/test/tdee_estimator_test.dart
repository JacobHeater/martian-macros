import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/logs.dart';
import 'support/simulate_logs.dart';
import 'support/synthetic_user.dart';

void main() {
  const estimator = TdeeEstimator();
  const trendModel = WeightTrendModel();
  const bmr = 1850.0;
  const prior = TdeePrior(kcal: 2500, sigmaKcal: 375);

  TdeeEstimate estimate(SyntheticUser user, Logs logs) {
    final asOf = user.today.addDays(-1);
    return estimator.estimate(
      asOf: asOf,
      intake: logs.intake,
      trend: trendModel.smooth(logs.weights, through: asOf),
      prior: prior,
      bmrKcal: bmr,
      energyDensityForSlope: (slope) => energyDensityForSlope(
        slopeKgPerDay: slope,
        fatMassKg: user.fatMassKg,
        resistanceTrained: true,
      ),
    );
  }

  double windowMean(List<double> values, int days) {
    final window = values.sublist(values.length - days);
    return window.reduce((a, b) => a + b) / window.length;
  }

  test('holds the prior until there is enough data', () {
    final user = SyntheticUser(seed: 1);
    final logs = simulate(user, days: 10, loggedKcal: 2100);
    final result = estimate(user, logs);
    expect(result.status, TdeeStatus.held);
    expect(result.kcal, prior.kcal);
  });

  test('updates from a short window once 14 days exist', () {
    final user = SyntheticUser(seed: 2);
    final logs = simulate(user, days: 15, loggedKcal: 2100);
    expect(estimate(user, logs).status, TdeeStatus.updated);
  });

  /// Runs [trials] independent users and summarises estimation error
  /// against [truth] (expected TDEE in logging units).
  ({double bias, double rms, double coverage2Sigma, double meanExcluded})
  monteCarlo({
    required SyntheticUser Function(int seed) makeUser,
    required double loggedKcal,
    double Function(Logs logs, SyntheticUser user)? truth,
    int trials = 40,
  }) {
    var sumErr = 0.0;
    var sumSq = 0.0;
    var covered = 0;
    var excluded = 0;
    for (var seed = 100; seed < 100 + trials; seed++) {
      final user = makeUser(seed);
      final logs = simulate(user, days: 35, loggedKcal: loggedKcal);
      final result = estimate(user, logs);
      expect(result.status, TdeeStatus.updated);
      final expected = truth?.call(logs, user) ?? windowMean(logs.trueTdee, 28);
      final err = result.kcal - expected;
      sumErr += err;
      sumSq += err * err;
      if (err.abs() <= 2 * result.sigmaKcal) covered++;
      excluded += result.excludedPartialDays;
    }
    return (
      bias: sumErr / trials,
      rms: math.sqrt(sumSq / trials),
      coverage2Sigma: covered / trials,
      meanExcluded: excluded / trials,
    );
  }

  // With realistic multi-day water noise, a single 28-day estimate is only
  // good to roughly ±150–200 kcal; that is physics, not a bug. What the
  // engine must guarantee is no systematic bias and honest uncertainty.
  test('is unbiased with honest uncertainty for accurate loggers', () {
    final stats = monteCarlo(
      makeUser: (seed) => SyntheticUser(seed: seed, baseTdeeKcal: 2800),
      loggedKcal: 2200,
    );
    expect(stats.bias.abs(), lessThan(60));
    expect(stats.rms, lessThan(220));
    expect(stats.coverage2Sigma, greaterThanOrEqualTo(0.85));
  });

  test('expresses TDEE in logging units for a consistent under-reporter', () {
    final stats = monteCarlo(
      makeUser: (seed) => SyntheticUser(
        seed: seed,
        baseTdeeKcal: 2800,
        underReportFraction: 0.25,
      ),
      loggedKcal: 1700,
      // Storage is measured in true kcal, so the estimate is true TDEE minus
      // the unlogged calories at the current intake: exact maintenance in
      // logging units once intake settles at target (the loop converges).
      truth: (logs, _) => windowMean(logs.trueTdee, 28) - 0.25 * 1700 / 0.75,
    );
    expect(stats.bias.abs(), lessThan(60));
    expect(stats.rms, lessThan(220));
  });

  test('excludes unmarked partial days instead of reading them as fasting', () {
    final stats = monteCarlo(
      makeUser: (seed) => SyntheticUser(
        seed: seed,
        baseTdeeKcal: 2800,
        partialLogProbability: 0.35,
      ),
      loggedKcal: 2200,
    );
    expect(stats.meanExcluded, greaterThan(3));
    // Partial days that slip past the 65%-of-P75 heuristic bias the
    // estimate low; it must stay small.
    expect(stats.bias, greaterThan(-150));
    expect(stats.rms, lessThan(260));
  });

  test('never uses a day the user marked partial', () {
    final user = SyntheticUser(seed: 10, baseTdeeKcal: 2800);
    final logs = simulate(user, days: 28, loggedKcal: 2200);
    final marked = [
      for (final d in logs.intake)
        IntakeDay(
          date: d.date,
          kcal: d.kcal,
          proteinG: d.proteinG,
          carbsG: d.carbsG,
          fatG: d.fatG,
          completeness: DayCompleteness.partial,
        ),
    ];
    final asOf = user.today.addDays(-1);
    final result = estimator.estimate(
      asOf: asOf,
      intake: marked,
      trend: trendModel.smooth(logs.weights, through: asOf),
      prior: prior,
      bmrKcal: bmr,
      energyDensityForSlope: (_) => 7000,
    );
    expect(result.status, TdeeStatus.held);
    expect(result.usableIntakeDays, 0);
  });

  test('restarts the window after a logging-style switch', () {
    final user = SyntheticUser(
      seed: 11,
      baseTdeeKcal: 2800,
      underReportFraction: 0.30,
    );
    final logs = simulate(
      user,
      days: 35,
      loggedKcal: 2000,
      beforeDay: (day, u) {
        if (day == 14) {
          // Bought a food scale: logging becomes nearly unbiased.
          u
            ..underReportFraction = 0.05
            ..weighedShare = 1;
        }
      },
    );
    final result = estimate(user, logs);
    // The window restarts at the first logged day of the new style (the
    // switch day itself may be unlogged).
    final switchDay = CalendarDate(2026, 1, 1).addDays(14);
    expect(switchDay.daysUntil(result.windowStart!), inInclusiveRange(0, 2));
    expect(result.status, TdeeStatus.updated);
    expect(result.styleRestartOn, isNotNull);
    expect(result.kcal, closeTo(0.95 * windowMean(logs.trueTdee, 21), 300));
  });

  test('clamps implausible results to the BMR band', () {
    final user = SyntheticUser(seed: 12, baseTdeeKcal: 2800);
    // Logs only a token amount yet holds weight: physically impossible.
    final logs = simulate(user, days: 28, loggedKcal: 2800);
    final tiny = [
      for (final d in logs.intake)
        IntakeDay(
          date: d.date,
          kcal: 600,
          proteinG: 40,
          carbsG: 60,
          fatG: 20,
          completeness: DayCompleteness.complete,
        ),
    ];
    final asOf = user.today.addDays(-1);
    final result = estimator.estimate(
      asOf: asOf,
      intake: tiny,
      trend: trendModel.smooth(logs.weights, through: asOf),
      prior: const TdeePrior(kcal: 2500, sigmaKcal: 2000),
      bmrKcal: bmr,
      energyDensityForSlope: (_) => 7000,
    );
    expect(result.clampedToBounds, isTrue);
    expect(result.kcal, bmr * 1.1);
  });
}
