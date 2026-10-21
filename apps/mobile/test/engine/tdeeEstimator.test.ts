import { expect, it } from 'vitest';
import { CalendarDate, IntakeDay } from '../../src/domain';
import {
  energyDensityForSlope,
  type TdeeEstimate,
  TdeeEstimator,
  type TdeePrior,
  WeightTrendModel,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import type { Logs } from './support/Logs';
import { simulate } from './support/simulate';
import { SyntheticUser } from './support/SyntheticUser';

const estimator = new TdeeEstimator();
const trendModel = new WeightTrendModel();
const bmr = 1850;
const prior: TdeePrior = { kcal: 2500, sigmaKcal: 375 };

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

function windowMean(values: readonly number[], days: number): number {
  const window = values.slice(values.length - days);
  return window.reduce((a, b) => a + b) / window.length;
}

it('holds the prior until there is enough data', () => {
  const user = new SyntheticUser({ seed: 1 });
  const logs = simulate(user, { days: 10, loggedKcal: 2100 });
  const result = estimate(user, logs);
  expect(result.status).toBe('held');
  expect(result.kcal).toBe(prior.kcal);
});

it('updates from a short window once 14 days exist', () => {
  const user = new SyntheticUser({ seed: 2 });
  const logs = simulate(user, { days: 15, loggedKcal: 2100 });
  expect(estimate(user, logs).status).toBe('updated');
});

/**
 * Runs `trials` independent users and summarises estimation error
 * against `truth` (expected TDEE in logging units).
 */
function monteCarlo({
  makeUser,
  loggedKcal,
  truth,
  trials = 40,
}: {
  makeUser: (seed: number) => SyntheticUser;
  loggedKcal: number;
  truth?: (logs: Logs, user: SyntheticUser) => number;
  trials?: number;
}): { bias: number; rms: number; coverage2Sigma: number; meanExcluded: number } {
  let sumErr = 0;
  let sumSq = 0;
  let covered = 0;
  let excluded = 0;
  for (let seed = 100; seed < 100 + trials; seed++) {
    const user = makeUser(seed);
    const logs = simulate(user, { days: 35, loggedKcal });
    const result = estimate(user, logs);
    expect(result.status).toBe('updated');
    const expected = truth?.(logs, user) ?? windowMean(logs.trueTdee, 28);
    const err = result.kcal - expected;
    sumErr += err;
    sumSq += err * err;
    if (Math.abs(err) <= 2 * result.sigmaKcal) covered++;
    excluded += result.excludedPartialDays;
  }
  return {
    bias: sumErr / trials,
    rms: Math.sqrt(sumSq / trials),
    coverage2Sigma: covered / trials,
    meanExcluded: excluded / trials,
  };
}

// With realistic multi-day water noise, a single 28-day estimate is only
// good to roughly ±150–200 kcal; that is physics, not a bug. What the
// engine must guarantee is no systematic bias and honest uncertainty.
it('is unbiased with honest uncertainty for accurate loggers', () => {
  const stats = monteCarlo({
    makeUser: (seed) => new SyntheticUser({ seed, baseTdeeKcal: 2800 }),
    loggedKcal: 2200,
  });
  expect(Math.abs(stats.bias)).toBeLessThan(60);
  expect(stats.rms).toBeLessThan(220);
  expect(stats.coverage2Sigma).toBeGreaterThanOrEqual(0.85);
});

// MM-150: someone who mostly estimates meals is unbiased but noisy. Each
// estimate is 40% uncertain, and a day of several of them is about 20%. The
// noise averages out over a window and must not bias the estimate. (At 30%
// a day the unmarked-partial-day rule starts dropping honest low days and the
// estimate drifts about 160 kcal high; see the MM-150 ticket.)
it('is unbiased for a logger whose estimates are noisy (MM-150)', () => {
  const stats = monteCarlo({
    makeUser: (seed) => new SyntheticUser({ seed, baseTdeeKcal: 2800, entrySigma: 0.2 }),
    loggedKcal: 2200,
  });
  expect(Math.abs(stats.bias)).toBeLessThan(100);
  expect(stats.coverage2Sigma).toBeGreaterThanOrEqual(0.85);
});

// MM-173: at 30% a day the fixed 65%-of-P75 rule dropped honest low days
// and the estimate drifted about 160 kcal high; the threshold now widens
// with the window's own spread.
it('stays unbiased when a noisy logger has days 30% apart (MM-173)', () => {
  const stats = monteCarlo({
    makeUser: (seed) => new SyntheticUser({ seed, baseTdeeKcal: 2800, entrySigma: 0.3 }),
    loggedKcal: 2200,
  });
  expect(Math.abs(stats.bias)).toBeLessThan(100);
});

it('expresses TDEE in logging units for a consistent under-reporter', () => {
  const stats = monteCarlo({
    makeUser: (seed) => new SyntheticUser({ seed, baseTdeeKcal: 2800, underReportFraction: 0.25 }),
    loggedKcal: 1700,
    // Storage is measured in true kcal, so the estimate is true TDEE minus
    // the unlogged calories at the current intake: exact maintenance in
    // logging units once intake settles at target (the loop converges).
    truth: (logs) => windowMean(logs.trueTdee, 28) - (0.25 * 1700) / 0.75,
  });
  expect(Math.abs(stats.bias)).toBeLessThan(60);
  expect(stats.rms).toBeLessThan(220);
});

it('excludes unmarked partial days instead of reading them as fasting', () => {
  const stats = monteCarlo({
    makeUser: (seed) => new SyntheticUser({ seed, baseTdeeKcal: 2800, partialLogProbability: 0.35 }),
    loggedKcal: 2200,
  });
  expect(stats.meanExcluded).toBeGreaterThan(3);
  // Partial days that slip past the 65%-of-P75 heuristic bias the
  // estimate low; it must stay small.
  expect(stats.bias).toBeGreaterThan(-150);
  expect(stats.rms).toBeLessThan(260);
});

it('never uses a day the user marked partial', () => {
  const user = new SyntheticUser({ seed: 10, baseTdeeKcal: 2800 });
  const logs = simulate(user, { days: 28, loggedKcal: 2200 });
  const marked = logs.intake.map(
    (d) =>
      new IntakeDay({
        date: d.date,
        kcal: d.kcal,
        proteinG: d.proteinG,
        carbsG: d.carbsG,
        fatG: d.fatG,
        completeness: 'partial',
      }),
  );
  const asOf = user.today.addDays(-1);
  const result = estimator.estimate({
    asOf,
    intake: marked,
    trend: trendModel.smooth(logs.weights, { through: asOf }),
    prior,
    bmrKcal: bmr,
    energyDensityForSlope: () => 7000,
  });
  expect(result.status).toBe('held');
  expect(result.usableIntakeDays).toBe(0);
});

it('restarts the window after a logging-style switch', () => {
  const user = new SyntheticUser({ seed: 11, baseTdeeKcal: 2800, underReportFraction: 0.3 });
  const logs = simulate(user, {
    days: 35,
    loggedKcal: 2000,
    beforeDay: (day, u) => {
      if (day === 14) {
        // Bought a food scale: logging becomes nearly unbiased.
        u.underReportFraction = 0.05;
        u.weighedShare = 1;
      }
    },
  });
  const result = estimate(user, logs);
  // The window restarts at the first logged day of the new style (the
  // switch day itself may be unlogged).
  const switchDay = CalendarDate.of(2026, 1, 1).addDays(14);
  const apart = switchDay.daysUntil(result.windowStart as CalendarDate);
  expect(apart).toBeGreaterThanOrEqual(0);
  expect(apart).toBeLessThanOrEqual(2);
  expect(result.status).toBe('updated');
  expect(result.styleRestartOn).toBeDefined();
  expectClose(result.kcal, 0.95 * windowMean(logs.trueTdee, 21), 300);
});

it('restarts the window when weighing gives way to estimates (MM-150)', () => {
  const user = new SyntheticUser({ seed: 13, baseTdeeKcal: 2800, underReportFraction: 0.05, weighedShare: 1 });
  const logs = simulate(user, {
    days: 42,
    loggedKcal: 2400,
    beforeDay: (day, u) => {
      if (day === 21) {
        // Weighing stops; meals are estimated and run low.
        u.underReportFraction = 0.25;
        u.weighedShare = 0;
      }
    },
  });
  const result = estimate(user, logs);
  const switchDay = CalendarDate.of(2026, 1, 1).addDays(21);
  expect(result.styleRestartOn).toBeDefined();
  const apart = switchDay.daysUntil(result.windowStart as CalendarDate);
  expect(apart).toBeGreaterThanOrEqual(0);
  expect(apart).toBeLessThanOrEqual(2);
});

// MM-46: hand portions are a logging style of their own.
it('restarts the window when three weeks of hand portions give way to a scale', () => {
  const user = new SyntheticUser({ seed: 17, baseTdeeKcal: 2800, underReportFraction: 0.2, handShare: 1 });
  const logs = simulate(user, {
    days: 42,
    loggedKcal: 2200,
    beforeDay: (day, u) => {
      if (day === 21) {
        u.underReportFraction = 0.05;
        u.handShare = 0;
        u.weighedShare = 1;
      }
    },
  });
  const result = estimate(user, logs);
  const switchDay = CalendarDate.of(2026, 1, 1).addDays(21);
  expect(result.styleRestartOn).toBeDefined();
  const apart = switchDay.daysUntil(result.windowStart as CalendarDate);
  expect(apart).toBeGreaterThanOrEqual(0);
  expect(apart).toBeLessThanOrEqual(2);
});

it('restarts the window when hand portions give way to label servings', () => {
  // Weighed share stays at zero throughout: only the hand style changes.
  const user = new SyntheticUser({ seed: 19, baseTdeeKcal: 2800, underReportFraction: 0.2, handShare: 1 });
  const logs = simulate(user, {
    days: 42,
    loggedKcal: 2200,
    beforeDay: (day, u) => {
      if (day === 21) {
        u.underReportFraction = 0.1;
        u.handShare = 0;
      }
    },
  });
  const result = estimate(user, logs);
  const switchDay = CalendarDate.of(2026, 1, 1).addDays(21);
  expect(result.styleRestartOn).toBeDefined();
  const apart = switchDay.daysUntil(result.windowStart as CalendarDate);
  expect(apart).toBeGreaterThanOrEqual(0);
  expect(apart).toBeLessThanOrEqual(2);
});

it('a steady mix of hand portions and labels is no switch', () => {
  const user = new SyntheticUser({ seed: 23, baseTdeeKcal: 2800, underReportFraction: 0.15, handShare: 0.5 });
  const logs = simulate(user, { days: 42, loggedKcal: 2200 });
  expect(estimate(user, logs).styleRestartOn).toBeUndefined();
});

it('clamps implausible results to the BMR band', () => {
  const user = new SyntheticUser({ seed: 12, baseTdeeKcal: 2800 });
  // Logs only a token amount yet holds weight: physically impossible.
  const logs = simulate(user, { days: 28, loggedKcal: 2800 });
  const tiny = logs.intake.map(
    (d) => new IntakeDay({ date: d.date, kcal: 600, proteinG: 40, carbsG: 60, fatG: 20, completeness: 'complete' }),
  );
  const asOf = user.today.addDays(-1);
  const result = estimator.estimate({
    asOf,
    intake: tiny,
    trend: trendModel.smooth(logs.weights, { through: asOf }),
    prior: { kcal: 2500, sigmaKcal: 2000 },
    bmrKcal: bmr,
    energyDensityForSlope: () => 7000,
  });
  expect(result.clampedToBounds).toBe(true);
  expect(result.kcal).toBe(bmr * 1.1);
});
