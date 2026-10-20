import { expect, it } from 'vitest';
import { CalendarDate, Profile, ScreeningAnswers, UserSetup } from '../../src/domain';
import { DietBreakRule, findReliefOffer, type TargetsRecord } from '../../src/engine';
import { runCoachLoop } from './support/runCoachLoop';
import { SyntheticUser } from './support/SyntheticUser';
import type { WeekResult } from './support/WeekResult';

/**
 * MM-135 through the whole weekly loop: simulated people whose true
 * physiology the engine never sees, dieting long enough to reach the offer
 * at twelve weeks and the break the app plans at twenty, and resuming after.
 */
const profile = new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 });
const day0 = CalendarDate.of(2026, 1, 1);

const setup = new UserSetup({
  profile,
  screening: new ScreeningAnswers(),
  trainingStatus: 'intermediate',
  trainingDaysPerWeek: 3,
  goalMode: 'fatLoss',
  onboardedOn: day0,
});

const at = (r: readonly WeekResult[], week: number) => r[week] as WeekResult;
const person = (seed: number) =>
  new SyntheticUser({ seed, start: day0, baseTdeeKcal: 2900, startWeightKg: 95, bodyFatPercent: 28, adherenceSigmaKcal: 120 });

it('twelve weeks in, the break is offered; taken, it holds two weeks and the deficit resumes unthrottled', () => {
  const offeredAt: number[] = [];
  const results = runCoachLoop({
    user: person(135),
    profile,
    mode: 'fatLoss',
    weeks: 26,
    beforeCheckIn: (week, history) => {
      const offer = findReliefOffer({ setup, checkIns: [], history, today: day0.addDays(7 * week) });
      if (offer === undefined) return undefined;
      offeredAt.push(week);
      expect(offer.reason, `week ${week}`).toBe('longDeficit');
      return { takeBreak: true };
    },
  });

  expect(offeredAt[0], 'first offered at twelve whole weeks').toBe(DietBreakRule.offerFromWeeks);
  const onBreak = at(results, 12);
  expect(onBreak.targets.flags).toContain('requestedBreak');
  expect(onBreak.targets.weeklyRateFraction).toBe(0);
  // Exempt from the step limit: calories come back at once.
  expect(onBreak.targets.kcal - at(results, 11).targets.kcal).toBeGreaterThan(100);
  expect(onBreak.targets.flags).not.toContain('rateLimited');
  // The break's second week holds the same targets.
  expect(at(results, 13).targets).toBe(onBreak.targets);
  // Then the deficit resumes, in one step, with its count restarted.
  const resumed = at(results, 14);
  expect(resumed.targets.weeklyRateFraction).toBeLessThan(0);
  expect(resumed.targets.flags).not.toContain('rateLimited');
  expect(onBreak.targets.kcal - resumed.targets.kcal).toBeGreaterThan(100);
  expect(resumed.explanation?.lines.map((l) => l.reason)).toContain('breakEnded');
  // Nothing is forced in the twelve weeks after: the count started again.
  for (let w = 14; w < results.length; w++) {
    expect(at(results, w).targets.flags.has('dietBreak'), `week ${w}`).toBe(false);
  }
  // The offer is not made again inside the break or in the first weeks after it.
  expect(offeredAt.filter((w) => w > 12 && w < 26)).toEqual([]);
});

it('declined every time, the app plans the break itself at twenty weeks, for two weeks, and the deficit resumes', () => {
  for (const seed of [20, 21]) {
    const results = runCoachLoop({ user: person(seed), profile, mode: 'fatLoss', weeks: 24 });
    for (let w = 0; w < DietBreakRule.forceFromWeeks; w++) {
      expect(at(results, w).targets.flags.has('dietBreak'), `seed ${seed}, week ${w}`).toBe(false);
      expect(at(results, w).targets.weeklyRateFraction, `seed ${seed}, week ${w}`).toBeLessThan(0);
    }
    const planned = at(results, 20);
    expect(planned.targets.flags, `seed ${seed}`).toContain('dietBreak');
    expect(planned.targets.weeklyRateFraction).toBe(0);
    expect(planned.targets.kcal - at(results, 19).targets.kcal, 'exempt from the step limit').toBeGreaterThan(100);
    expect(at(results, 21).targets, 'the second week').toBe(planned.targets);
    const resumed = at(results, 22);
    expect(resumed.targets.weeklyRateFraction).toBeLessThan(0);
    expect(resumed.targets.flags).not.toContain('dietBreak');
    expect(resumed.targets.flags).not.toContain('rateLimited');
    expect(planned.targets.kcal - resumed.targets.kcal).toBeGreaterThan(100);
    expect(at(results, 23).targets.weeklyRateFraction).toBeLessThan(0);
  }
});

it('a week at or above maintenance in the middle restarts the count, so the planned break comes twenty weeks after it', () => {
  // Maintenance for week 10 (seven days): the deficit resumes at week 11 and runs twenty weeks to week 31.
  const results = runCoachLoop({
    user: person(7),
    profile,
    mode: 'fatLoss',
    weeks: 33,
    modeAt: (week) => (week === 10 ? 'maintenance' : 'fatLoss'),
  });
  expect(at(results, 10).targets.weeklyRateFraction).toBe(0);
  const planned = results.findIndex((w) => w.targets.flags.has('dietBreak'));
  expect(planned).toBe(31);
});

it('every step outside a break and its end is still at most 100 kcal', () => {
  const results = runCoachLoop({ user: person(3), profile, mode: 'fatLoss', weeks: 24 });
  const isBreakEdge = (w: number) => {
    const flags = (i: number) => at(results, i).targets.flags;
    return flags(w).has('dietBreak') || flags(w - 1).has('dietBreak');
  };
  let edges = 0;
  for (let w = 1; w < results.length; w++) {
    if (isBreakEdge(w)) {
      edges++;
      continue;
    }
    expect(Math.abs(at(results, w).targets.kcal - at(results, w - 1).targets.kcal), `week ${w}`).toBeLessThanOrEqual(100 + 1e-9);
  }
  expect(edges, 'the run reaches the break').toBeGreaterThan(0);
});

/** The records the loop keeps are the engine's: a break's record is one the app's history could hold. */
it('the loop records a break as the app would', () => {
  let seen: TargetsRecord | undefined;
  runCoachLoop({
    user: person(9),
    profile,
    mode: 'fatLoss',
    weeks: 22,
    beforeCheckIn: (_week, history) => {
      const last = history[history.length - 1];
      if (last?.targets.flags.has('dietBreak')) seen = last;
      return undefined;
    },
  });
  expect(seen?.mode).toBe('fatLoss');
  expect(seen?.targets.weeklyRateFraction).toBe(0);
});
