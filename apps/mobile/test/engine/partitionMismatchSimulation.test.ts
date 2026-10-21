import { describe, expect, it } from 'vitest';
import {
  energyDensityForSlope,
  type TdeeEstimate,
  TdeeEstimator,
  type TdeePrior,
  WeightTrendModel,
} from '../../src/engine';
import type { Logs } from './support/Logs';
import { simulate } from './support/simulate';
import { SyntheticUser } from './support/SyntheticUser';

/**
 * MM-35's first question, as far as the two-step model can answer it: what
 * the expenditure estimate does when the body partitions a loss differently
 * from the model the engine assumes (MM-30's admitted weakness). Forty
 * simulated users on a 600 kcal deficit, whose lean share of each kilogram
 * lost is ten points above or below the engine's, against the same users
 * with the same noise whose partition is the engine's own.
 *
 * Arithmetic sets the expectation: the estimate is intake plus the trend's
 * slope times the energy density the engine assumes, so a leaner loss (lower
 * true density) reads as a larger deficit and the estimate runs high, about
 * 50 to 60 kcal a day at this deficit before the prior's pull. That is under
 * a third of what multi-day water costs a single 28-day estimate (MM-23),
 * which is the case MM-35 records against building a joint model.
 */
const estimator = new TdeeEstimator();
const trendModel = new WeightTrendModel();
const bmr = 1850;
const prior: TdeePrior = { kcal: 2500, sigmaKcal: 375 };
const trials = 40;

function estimate(user: SyntheticUser, logs: Logs): TdeeEstimate {
  const asOf = user.today.addDays(-1);
  return estimator.estimate({
    asOf,
    intake: logs.intake,
    trend: trendModel.smooth(logs.weights, { through: asOf }),
    prior,
    bmrKcal: bmr,
    energyDensityForSlope: (slope) =>
      energyDensityForSlope({ slopeKgPerDay: slope, fatMassKg: user.fatMassKg, resistanceTrained: true }),
  });
}

/** Each user's error against the true expenditure of the window. */
function errors(leanFractionShift: number): { errors: number[]; coverage2Sigma: number } {
  const all: number[] = [];
  let covered = 0;
  for (let seed = 500; seed < 500 + trials; seed++) {
    const user = new SyntheticUser({ seed, baseTdeeKcal: 2800, leanFractionShift });
    const logs = simulate(user, { days: 35, loggedKcal: 2200 });
    const result = estimate(user, logs);
    expect(result.status).toBe('updated');
    const window = logs.trueTdee.slice(logs.trueTdee.length - 28);
    const err = result.kcal - window.reduce((a, b) => a + b) / window.length;
    all.push(err);
    if (Math.abs(err) <= 2 * result.sigmaKcal) covered++;
  }
  return { errors: all, coverage2Sigma: covered / trials };
}

const meanDifference = (a: readonly number[], b: readonly number[]) =>
  a.reduce((sum, value, i) => sum + value - (b[i] ?? 0), 0) / a.length;

describe('a body that partitions differently from the engine (MM-35)', () => {
  it('a leaner loss than assumed runs the estimate high, by less than 100 kcal', () => {
    const leaner = errors(0.1);
    const shift = meanDifference(leaner.errors, errors(0).errors);
    expect(shift).toBeGreaterThan(0);
    expect(shift).toBeLessThan(100);
    expect(leaner.coverage2Sigma).toBeGreaterThanOrEqual(0.8);
  });

  it('a fattier loss than assumed runs it low, by less than 100 kcal', () => {
    const fattier = errors(-0.1);
    const shift = meanDifference(fattier.errors, errors(0).errors);
    expect(shift).toBeLessThan(0);
    expect(shift).toBeGreaterThan(-100);
    expect(fattier.coverage2Sigma).toBeGreaterThanOrEqual(0.8);
  });
});
