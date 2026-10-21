import { describe, expect, it } from 'vitest';
import { WeekShape } from '../../src/domain/WeekShape';
import {
  energyDensityForSlope,
  shapeWeek,
  type TdeeEstimate,
  TdeeEstimator,
  type TdeePrior,
  WeightTrendModel,
} from '../../src/engine';
import type { Logs } from './support/Logs';
import { SyntheticUser } from './support/SyntheticUser';

/**
 * MM-124's simulator suite: the expenditure estimate over a shaped week.
 * The estimate is meant to be indifferent to the shape (MM-23): a week with
 * higher days totals seven flat days, so over a 28-day window (four whole
 * weeks) the average intake is the same, and the partial-day rule (MM-27)
 * must not take a planned lower day for a half-logged one. Simulated users
 * eat the shape as planned, with the usual logging and adherence noise and a
 * glycogen-and-gut store (MM-131) that rises and falls with the higher days,
 * and each is compared with the same user, same noise, eating flat.
 */
const estimator = new TdeeEstimator();
const trendModel = new WeightTrendModel();
const bmr = 1850;
const prior: TdeePrior = { kcal: 2500, sigmaKcal: 375 };
const flatKcal = 2200;
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

/** Thirty-five days of `week` eaten as planned (a flat week when it has no higher days). */
function live(user: SyntheticUser, week: WeekShape): Logs {
  const shaped = shapeWeek({ flatKcal, floorKcal: 1200, week });
  const logs: Logs = { intake: [], weights: [], trueTdee: [] };
  for (let d = 0; d < 35; d++) {
    logs.trueTdee.push(user.trueTdeeKcal);
    const day = user.liveDay(week.higherDays.has(user.today.weekday) ? shaped.higherKcal : shaped.lowerKcal);
    if (day.intake !== undefined) logs.intake.push(day.intake);
    if (day.weight !== undefined) logs.weights.push(day.weight);
  }
  return logs;
}

interface Stats {
  bias: number;
  coverage2Sigma: number;
  meanExcluded: number;
  errors: number[];
}

function monteCarlo(week: WeekShape, glycogenSwingFraction: number): Stats {
  const errors: number[] = [];
  let covered = 0;
  let excluded = 0;
  for (let seed = 300; seed < 300 + trials; seed++) {
    const user = new SyntheticUser({ seed, baseTdeeKcal: 2800, glycogenSwingFraction });
    const logs = live(user, week);
    const result = estimate(user, logs);
    expect(result.status).toBe('updated');
    const window = logs.trueTdee.slice(logs.trueTdee.length - 28);
    const err = result.kcal - window.reduce((a, b) => a + b) / window.length;
    errors.push(err);
    if (Math.abs(err) <= 2 * result.sigmaKcal) covered++;
    excluded += result.excludedPartialDays;
  }
  return {
    bias: errors.reduce((a, b) => a + b) / trials,
    coverage2Sigma: covered / trials,
    meanExcluded: excluded / trials,
    errors,
  };
}

describe('the estimate over a shaped week (MM-124)', () => {
  const shapes: readonly [string, WeekShape][] = [
    ['the weekend 30% higher', new WeekShape({ higherDays: [6, 0], raise: 0.3 })],
    ['three days 30% higher, held to 15% lower days', new WeekShape({ higherDays: [1, 3, 5], raise: 0.3 })],
  ];
  for (const glycogen of [0, 0.02]) {
    for (const [name, week] of shapes) {
      it(`${name}${glycogen > 0 ? ', with a glycogen store' : ''}: unbiased, honest, and no planned day dropped`, () => {
        const flat = monteCarlo(WeekShape.flat, glycogen);
        const shaped = monteCarlo(week, glycogen);
        expect(Math.abs(shaped.bias), 'bias').toBeLessThan(100);
        expect(shaped.coverage2Sigma, 'coverage').toBeGreaterThanOrEqual(0.85);
        // The same people with the same noise, eating flat: the shape adds next to nothing.
        const paired = shaped.errors.reduce((sum, err, i) => sum + err - (flat.errors[i] ?? 0), 0) / trials;
        expect(Math.abs(paired), 'shaped against flat').toBeLessThan(60);
        expect(shaped.meanExcluded, 'partial days excluded').toBeLessThanOrEqual(flat.meanExcluded + 0.5);
      });
    }
  }
});
