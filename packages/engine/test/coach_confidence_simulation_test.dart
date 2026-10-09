import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/simulate_logs.dart';
import 'support/synthetic_user.dart';

void main() {
  const estimator = TdeeEstimator();
  const trendModel = WeightTrendModel();
  const prior = TdeePrior(kcal: 2500, sigmaKcal: 375);

  double windowMean(List<double> values, int days) {
    final window = values.sublist(values.length - days);
    return window.reduce((a, b) => a + b) / window.length;
  }

  test('Good estimates are within 200 kcal of simulated truth nine times in '
      'ten', () {
    const trials = 100;
    var goodEstimates = 0;
    var accurateGoodEstimates = 0;

    for (var seed = 100; seed < 100 + trials; seed++) {
      final user = SyntheticUser(seed: seed, baseTdeeKcal: 2800);
      final logs = simulate(user, days: 56, loggedKcal: 2200);
      final asOf = user.today.addDays(-1);
      final trend = trendModel.smooth(logs.weights, through: asOf);
      final estimate = estimator.estimate(
        asOf: asOf,
        intake: logs.intake,
        trend: trend,
        prior: prior,
        bmrKcal: 1850,
        energyDensityForSlope: (slope) => energyDensityForSlope(
          slopeKgPerDay: slope,
          fatMassKg: user.fatMassKg,
          resistanceTrained: true,
        ),
      );
      final confidence = assessCoachConfidence(
        estimate: estimate,
        asOf: asOf,
        intake: logs.intake,
        trend: trend,
        history: const [],
      );

      if (confidence.level != ConfidenceLevel.good) continue;
      goodEstimates++;
      final truth = windowMean(logs.trueTdee, estimator.windowDays);
      if ((estimate.kcal - truth).abs() <= 200) accurateGoodEstimates++;
    }

    expect(goodEstimates, greaterThanOrEqualTo(70));
    expect(
      accurateGoodEstimates / goodEstimates,
      greaterThanOrEqualTo(0.9),
      reason: '$accurateGoodEstimates of $goodEstimates Good estimates',
    );
  });
}
