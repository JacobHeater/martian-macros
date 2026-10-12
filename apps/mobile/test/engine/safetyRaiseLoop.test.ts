import { expect, it } from 'vitest';
import { CalendarDate, Profile } from '../../src/domain';
import { BodyFatEstimate, initialTdeePrior, mifflinStJeorKcal, safetyRaiseCapKcal } from '../../src/engine';
import { runCoachLoop } from './support/runCoachLoop';
import { SyntheticUser } from './support/SyntheticUser';
import type { WeekResult } from './support/WeekResult';

/**
 * MM-115 through the whole weekly loop: simulated users whose true physiology
 * the engine never sees.
 */
const profile = new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 });
const day0 = CalendarDate.of(2026, 1, 1);

const startingEstimate = (weightKg: number) =>
  initialTdeePrior({
    bmrKcal: mifflinStJeorKcal({
      sex: profile.sex,
      weightKg,
      heightCm: profile.heightCm,
      ageYears: profile.ageOn(day0),
    }),
    dailyActivity: 'light',
    trainingDaysPerWeek: 3,
  }).kcal;

const at = (r: readonly WeekResult[], week: number) => r[week] as WeekResult;

const weeklyLoss = (r: readonly WeekResult[], from: number, to: number) =>
  (at(r, from).trueWeightKg - at(r, to).trueWeightKg) / at(r, from).trueWeightKg / (to - from);

const raised = (w: WeekResult) => w.targets.flags.has('raisedForSafePace');

// At +400 kcal a 92 kg man loses about 1.0% a week: at his limit, not over
// it, so nothing is raised. A lighter man with a larger underestimate is
// over it.
it('expenditure underestimated by 600 kcal: the target rises past the weekly step and the loss comes back under the limit', () => {
  const firsts: number[] = [];
  for (let seed = 500; seed < 520; seed++) {
    const user = new SyntheticUser({
      seed,
      start: day0,
      baseTdeeKcal: startingEstimate(80) + 600,
      startWeightKg: 80,
      bodyFatPercent: 25,
      skipLogProbability: 0.05,
      skipWeighInProbability: 0.2,
    });
    const results = runCoachLoop({ user, profile, mode: 'fatLoss', weeks: 14 });

    const first = results.findIndex(raised);
    expect(first, `seed ${seed}: a raise was issued`).toBeGreaterThan(0);
    firsts.push(first);
    const jump = at(results, first).targets.kcal - at(results, first - 1).targets.kcal;
    expect(jump, `seed ${seed}`).toBeGreaterThan(100);
    expect(jump).toBeLessThanOrEqual(safetyRaiseCapKcal + 1e-9);

    // In the three weeks after the raise the true loss is under 1.0% a week.
    // (It can drift back up later if a noisy expenditure estimate walks the
    // target down again; the rule acts again once that is clear.)
    expect(weeklyLoss(results, first, first + 3), `seed ${seed}`).toBeLessThan(0.01);
  }
  // The trend needs the days after the settling window before its pace is
  // clear, so a raise comes in the third to eighth week. Measured over
  // these twenty users: first raises in weeks 3 to 8, median 4 to 5.
  firsts.sort((a, b) => a - b);
  expect(firsts[firsts.length - 1]).toBeLessThanOrEqual(9);
  expect(firsts[Math.trunc(firsts.length / 2)]).toBeLessThanOrEqual(5);
});

it('the same user needs no safety raise when the estimate is right', () => {
  const user = new SyntheticUser({
    seed: 44,
    start: day0,
    baseTdeeKcal: startingEstimate(80),
    startWeightKg: 80,
    bodyFatPercent: 25,
  });
  const results = runCoachLoop({ user, profile, mode: 'fatLoss', weeks: 14 });
  expect(results.filter(raised)).toEqual([]);
});

it('a lean user losing clearly faster than 0.5% a week is raised', () => {
  // The formula body-fat estimate puts this man well above 12%, so the
  // engine holds him to 1.0%; give the loop a lean one directly.
  const user = new SyntheticUser({
    seed: 45,
    start: day0,
    baseTdeeKcal: startingEstimate(78) + 450,
    startWeightKg: 78,
    bodyFatPercent: 11,
  });
  const results = runCoachLoop({
    user,
    profile,
    mode: 'fatLoss',
    weeks: 14,
    bodyFat: new BodyFatEstimate({ percent: 11, sigmaPercent: 3 }),
  });
  expect(results.filter(raised).length).toBeGreaterThan(0);
});

it('no oscillation: a raise is not followed by two full-step falls', () => {
  let raises = 0;
  for (let seed = 300; seed < 340; seed++) {
    const user = new SyntheticUser({
      seed,
      start: day0,
      baseTdeeKcal: startingEstimate(90) + 300 + (seed % 3) * 250,
      startWeightKg: 90,
      bodyFatPercent: 24,
      underReportFraction: 0.1,
      skipLogProbability: 0.1,
      partialLogProbability: 0.05,
      skipWeighInProbability: 0.25,
      glycogenSwingFraction: 0.02,
    });
    const r = runCoachLoop({ user, profile, mode: 'fatLoss', weeks: 16 });
    for (let w = 1; w < r.length - 2; w++) {
      if (!raised(at(r, w))) continue;
      raises++;
      const step = (i: number) => at(r, i).targets.kcal - at(r, i - 1).targets.kcal;
      const fellFully = step(w + 1) <= -100 + 1e-9 && step(w + 2) <= -100 + 1e-9;
      expect(fellFully, `seed ${seed}, raise in week ${w}`).toBe(false);
    }
  }
  expect(raises, 'the scenario exercises the rule').toBeGreaterThan(0);
});

it('every step outside a safety raise is still at most 100 kcal', () => {
  for (let seed = 50; seed < 56; seed++) {
    const user = new SyntheticUser({ seed, start: day0, baseTdeeKcal: startingEstimate(88) + 300, startWeightKg: 88 });
    const r = runCoachLoop({ user, profile, mode: 'fatLoss', weeks: 14 });
    for (let w = 1; w < r.length; w++) {
      if (raised(at(r, w))) continue;
      expect(Math.abs(at(r, w).targets.kcal - at(r, w - 1).targets.kcal), `seed ${seed} week ${w}`).toBeLessThanOrEqual(
        100 + 1e-9,
      );
    }
  }
});
