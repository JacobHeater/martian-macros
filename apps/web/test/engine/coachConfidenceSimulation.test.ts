import { expect, it } from 'vitest';
import {
  assessCoachConfidence,
  energyDensityForSlope,
  TdeeEstimator,
  type TdeePrior,
  WeightTrendModel,
} from '../../src/engine';
import { simulate } from './support/simulate';
import { SyntheticUser } from './support/SyntheticUser';

const estimator = new TdeeEstimator();
const trendModel = new WeightTrendModel();
const prior: TdeePrior = { kcal: 2500, sigmaKcal: 375 };

function windowMean(values: readonly number[], days: number): number {
  const window = values.slice(values.length - days);
  return window.reduce((a, b) => a + b) / window.length;
}

it('Good estimates are within 200 kcal of simulated truth nine times in ten', () => {
  const trials = 100;
  let goodEstimates = 0;
  let accurateGoodEstimates = 0;
  for (let seed = 100; seed < 100 + trials; seed++) {
    const user = new SyntheticUser({ seed, baseTdeeKcal: 2800 });
    const logs = simulate(user, { days: 56, loggedKcal: 2200 });
    const asOf = user.today.addDays(-1);
    const trend = trendModel.smooth(logs.weights, { through: asOf });
    const estimate = estimator.estimate({
      asOf,
      intake: logs.intake,
      trend,
      prior,
      bmrKcal: 1850,
      energyDensityForSlope: (slope) =>
        energyDensityForSlope({ slopeKgPerDay: slope, fatMassKg: user.fatMassKg, resistanceTrained: true }),
    });
    const confidence = assessCoachConfidence({ estimate, asOf, intake: logs.intake, trend, history: [] });
    if (confidence.level !== 'good') continue;
    goodEstimates++;
    const truth = windowMean(logs.trueTdee, estimator.windowDays);
    if (Math.abs(estimate.kcal - truth) <= 200) accurateGoodEstimates++;
  }
  expect(goodEstimates).toBeGreaterThanOrEqual(70);
  expect(
    accurateGoodEstimates / goodEstimates,
    `${accurateGoodEstimates} of ${goodEstimates} Good estimates`,
  ).toBeGreaterThanOrEqual(0.9);
});
