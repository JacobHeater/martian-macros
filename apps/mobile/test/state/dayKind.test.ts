import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { StateError } from '../../src/lang/StateError';
import { AppState } from '../../src/state/AppState';
import { DayKindController } from '../../src/state/DayKindController';
import { Loadable } from '../../src/state/Loadable';
import { first } from '../support/first';
import { servicesOf } from '../support/servicesOf';
import { settled } from './support/settled';

/** MM-611: a day marked a Refeed or a Day off, as state: set up to today, never ahead, and read by no calculation. */
const today = CalendarDate.of(2026, 10, 18);

async function seeded() {
  const repos = new InMemoryRepositories();
  const clock = new FixedClock(today);
  await new DemoSeed(today).replace({
    eraser: repos.eraser,
    setup: repos.setup,
    weights: repos.weights,
    waist: repos.waist,
    food: repos.food,
    dayMarks: repos.dayMarks,
    targets: repos.targets,
    recovery: repos.recovery,
    workouts: repos.workouts,
  });
  return { repos, clock, state: new AppState(servicesOf(repos, clock)) };
}

describe('marking a day', () => {
  it('today and the days before it can be marked, changed and cleared', async () => {
    const repos = new InMemoryRepositories();
    const marks = new DayKindController({ dayKinds: repos.dayKinds, clock: new FixedClock(today) });
    expect(marks.canMark(today)).toBe(true);
    expect(marks.canMark(today.addDays(-30))).toBe(true);
    await marks.mark(today, 'refeed');
    await marks.mark(today.addDays(-3), 'dayOff');
    expect(await first(repos.dayKinds.watchDayKind(today))).toBe('refeed');
    expect(await first(repos.dayKinds.watchDayKind(today.addDays(-3)))).toBe('dayOff');
    await marks.mark(today, 'none');
    expect(await first(repos.dayKinds.watchDayKind(today))).toBe('none');
  });

  it('tomorrow cannot be marked: a plan is not a record', async () => {
    const repos = new InMemoryRepositories();
    const marks = new DayKindController({ dayKinds: repos.dayKinds, clock: new FixedClock(today) });
    expect(marks.canMark(today.addDays(1))).toBe(false);
    await expect(marks.mark(today.addDays(1), 'refeed')).rejects.toBeInstanceOf(StateError);
    expect(await first(repos.dayKinds.watchMarkedDays())).toEqual(new Map());
  });

  it("the day's mark is a cell that follows each change", async () => {
    const { repos, state } = await seeded();
    expect(await settled(state.dayKind(today), (k) => k.ready)).toEqual(Loadable.of('none'));
    await repos.dayKinds.setDayKind(today, 'dayOff');
    expect(await settled(state.dayKind(today), (k) => Loadable.valueOf(k) === 'dayOff')).toEqual(Loadable.of('dayOff'));
  });
});

describe('a mark changes no calculation', () => {
  it('energy use, the weight trend and the targets are identical with and without marks', async () => {
    const plain = await seeded();
    const marked = await seeded();
    for (let i = 0; i < 20; i += 3) await marked.repos.dayKinds.setDayKind(today.addDays(-i), i % 2 === 0 ? 'refeed' : 'dayOff');
    const coachOf = (s: AppState) => settled(s.coach, (c) => c !== undefined);
    const [a, b] = [await coachOf(plain.state), await coachOf(marked.state)];
    expect(b?.tdee).toEqual(a?.tdee);
    expect(b?.trend).toEqual(a?.trend);
    expect(b?.trendWeightKg).toBe(a?.trendWeightKg);
    const targetsOf = (s: AppState) => settled(s.currentTargets, (t) => t !== undefined);
    expect(await targetsOf(marked.state)).toEqual(await targetsOf(plain.state));
  });
});

describe('the monthly report', () => {
  it('states 2 refeeds and 1 day off in the month as counts, and nothing else moves', async () => {
    const plain = await seeded();
    const marked = await seeded();
    const periods = await settled(marked.state.reportPeriods, (p) => p.length > 0);
    const from = periods[0]?.from;
    if (from === undefined) throw new Error('No report period');
    await marked.repos.dayKinds.setDayKind(from.addDays(2), 'refeed');
    await marked.repos.dayKinds.setDayKind(from.addDays(9), 'refeed');
    await marked.repos.dayKinds.setDayKind(from.addDays(16), 'dayOff');
    const report = await settled(marked.state.monthlyReport(0), (r) => r !== undefined && r.refeeds === 2);
    const before = await settled(plain.state.monthlyReport(0), (r) => r !== undefined);
    expect([report?.refeeds, report?.daysOff]).toEqual([2, 1]);
    expect([before?.refeeds, before?.daysOff]).toEqual([0, 0]);
    expect(report?.daysLogged).toBe(before?.daysLogged);
    expect(report?.completeDays).toBe(before?.completeDays);
    expect(report?.estimate).toEqual(before?.estimate);
  });
});
