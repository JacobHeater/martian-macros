import { expect, it } from 'vitest';
import { CalendarDate, Profile } from '../../src/domain';
import { expectClose } from '../support/expectClose';
import { runCoachLoop } from './support/runCoachLoop';
import { SyntheticUser } from './support/SyntheticUser';
import type { WeekResult } from './support/WeekResult';

/**
 * End-to-end behaviour of the weekly coaching loop against simulated users
 * whose true physiology the engine never sees.
 */
const profile = new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 });

const at = (results: readonly WeekResult[], week: number) => results[week] as WeekResult;

function realizedWeeklyLossFraction(r: readonly WeekResult[], from: number, to: number): number {
  const start = at(r, from).trueWeightKg;
  const end = at(r, to).trueWeightKg;
  return (start - end) / start / (to - from);
}

function expectSafeSteps(results: readonly WeekResult[]): void {
  for (let w = 1; w < results.length; w++) {
    const step = Math.abs(at(results, w).targets.kcal - at(results, w - 1).targets.kcal);
    expect(step, `week ${w} step`).toBeLessThanOrEqual(100 + 1e-9);
    expect(at(results, w).targets.kcal).toBeGreaterThanOrEqual(1500);
  }
}

for (const seed of [21, 22, 23]) {
  it(`biased, sloppy logger still loses at about the target pace (seed ${seed})`, () => {
    const user = new SyntheticUser({
      seed,
      baseTdeeKcal: 3000, // The formula prior underestimates this user.
      startWeightKg: 92,
      bodyFatPercent: 26,
      underReportFraction: 0.2,
      partialLogProbability: 0.1,
      skipLogProbability: 0.1,
    });
    const results = runCoachLoop({ user, profile, mode: 'fatLoss', weeks: 16 });

    expectSafeSteps(results);

    // Target is 0.75%/week. After the engine converges, the realized true
    // loss must land in a safe, effective band.
    const pace = realizedWeeklyLossFraction(results, 6, 15);
    expect(pace).toBeGreaterThanOrEqual(0.004);
    expect(pace).toBeLessThanOrEqual(0.0105);

    // The estimate tracks maintenance in logging units.
    const last = at(results, results.length - 1);
    expectClose(last.tdee.kcal, last.trueTdeeKcal * (1 - last.underReportFraction), 250);
  });
}

it('no death spiral when logging quality collapses', () => {
  const user = new SyntheticUser({ seed: 31, baseTdeeKcal: 2700, startWeightKg: 88, underReportFraction: 0.1 });
  const results = runCoachLoop({
    user,
    profile,
    mode: 'fatLoss',
    weeks: 14,
    beforeWeek: (week, u) => {
      // From week 6, the user logs only part of most days and never
      // marks them, the pattern that starves naive adaptive engines.
      if (week >= 6) u.partialLogProbability = 0.6;
    },
  });

  expectSafeSteps(results);
  const healthy = at(results, 6).targets.kcal;
  const degraded = at(results, results.length - 1).targets.kcal;
  // Targets may drift, but must not ratchet down toward starvation.
  expect(healthy - degraded).toBeLessThan(250);
});

it('flat-weight recomp keeps intake near maintenance', () => {
  const user = new SyntheticUser({ seed: 41, baseTdeeKcal: 2600, startWeightKg: 80, bodyFatPercent: 18 });
  const results = runCoachLoop({ user, profile, mode: 'recomp', weeks: 10, trainingStatus: 'novice' });

  expectSafeSteps(results);
  const last = at(results, results.length - 1);
  expectClose(last.targets.kcal, last.trueTdeeKcal, 300);
});
