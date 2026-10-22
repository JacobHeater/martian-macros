import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { TargetShape } from '../../src/domain/TargetShape';
import { WeekShape } from '../../src/domain/WeekShape';
import {
  energyDensityForSlope,
  plannedDayShare,
  shapeWeek,
  type TdeeEstimate,
  TdeeEstimator,
  type TdeePrior,
  usableIntakeDays,
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
 * and each is compared with the same user, same noise, eating flat. Each
 * trial starts on a different weekday (seed % 7), so the window's ends fall
 * on higher and lower days alike.
 */
const estimator = new TdeeEstimator();
const trendModel = new WeightTrendModel();
const bmr = 1850;
const prior: TdeePrior = { kcal: 2500, sigmaKcal: 375 };
const flatKcal = 2200;
// A multiple of 7, so every start weekday is tried equally often.
const trials = 70;
const firstStart = CalendarDate.of(2026, 1, 1);

function estimate(user: SyntheticUser, logs: Logs, plannedShare: (date: CalendarDate) => number): TdeeEstimate {
  const asOf = user.today.addDays(-1);
  return estimator.estimate({
    plannedShare,
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
  /** Logged planned lower days in the windows (every logged day is whole: the simulated users never half-log). */
  lowerDays: number;
  /** Of those, the ones the partial-day rule dropped. */
  droppedLowerDays: number;
  errors: number[];
}

/** `counted`: the shape whose lower days are counted, so a flat run is read on the same days as its shaped twin. */
function monteCarlo(week: WeekShape, glycogenSwingFraction: number, counted: WeekShape = week): Stats {
  const errors: number[] = [];
  let covered = 0;
  let lowerDays = 0;
  let droppedLowerDays = 0;
  for (let seed = 300; seed < 300 + trials; seed++) {
    const start = firstStart.addDays(seed % 7);
    const user = new SyntheticUser({ seed, start, baseTdeeKcal: 2800, glycogenSwingFraction });
    const logs = live(user, week);
    const plannedShare = plannedDayShare([new TargetShape({ since: start, week })]);
    const result = estimate(user, logs, plannedShare);
    expect(result.status).toBe('updated');

    // The window is four whole weeks: each weekday, higher or lower, four times.
    const asOf = user.today.addDays(-1);
    const from = result.windowStart ?? asOf;
    expect(from.daysUntil(asOf) + 1, 'window length').toBe(28);
    const window = logs.intake.filter((d) => !d.date.isBefore(from) && !d.date.isAfter(asOf));
    const weekdays = Array.from({ length: from.daysUntil(asOf) + 1 }, (_, i) => from.addDays(i).weekday);
    for (let weekday = 0; weekday < 7; weekday++) {
      expect(weekdays.filter((w) => w === weekday), 'whole weeks').toHaveLength(4);
    }

    // Dropped days, read directly: the same rule over the same days, by date.
    const kept = new Set(usableIntakeDays(window, { plannedShare }).map((d) => d.date.epochDay));
    expect(window.length - kept.size, 'the estimate drops the days the rule drops').toBe(result.excludedPartialDays);
    for (const day of window) {
      if (counted.higherDays.has(day.date.weekday)) continue;
      lowerDays++;
      if (!kept.has(day.date.epochDay)) droppedLowerDays++;
    }

    const truth = logs.trueTdee.slice(logs.trueTdee.length - 28);
    const err = result.kcal - truth.reduce((a, b) => a + b) / truth.length;
    errors.push(err);
    if (Math.abs(err) <= 2 * result.sigmaKcal) covered++;
  }
  return {
    bias: errors.reduce((a, b) => a + b) / trials,
    coverage2Sigma: covered / trials,
    lowerDays,
    droppedLowerDays,
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
        const flat = monteCarlo(WeekShape.flat, glycogen, week);
        const shaped = monteCarlo(week, glycogen);
        expect(Math.abs(shaped.bias), 'bias').toBeLessThan(100);
        expect(shaped.coverage2Sigma, 'coverage').toBeGreaterThanOrEqual(0.88);
        // The same people with the same noise, eating flat: the shape adds next to nothing.
        const paired = shaped.errors.reduce((sum, err, i) => sum + err - (flat.errors[i] ?? 0), 0) / trials;
        expect(Math.abs(paired), 'shaped against flat').toBeLessThan(60);
        // A dropped planned day moves the estimate by about 15 kcal, too little for the paired bound to see, so
        // the dropped days are counted: one planned lower day dropped per trial would be one in sixteen to twenty.
        expect(shaped.lowerDays, 'lower days in the windows').toBeGreaterThan(0);
        expect(shaped.droppedLowerDays / shaped.lowerDays, 'planned lower days dropped').toBeLessThanOrEqual(0.01);
        expect(shaped.droppedLowerDays, 'planned lower days dropped, against the same days eaten flat').toBeLessThanOrEqual(
          flat.droppedLowerDays + Math.ceil(0.01 * shaped.lowerDays),
        );
      });
    }
  }
});
