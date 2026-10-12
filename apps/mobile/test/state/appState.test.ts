import { servicesOf } from '../support/servicesOf';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { Pause } from '../../src/domain/Pause';
import { ReminderKind } from '../../src/domain/ReminderKind';
import { ReminderSetting } from '../../src/domain/ReminderSetting';
import { builtInExercises } from '../../src/domain/training/builtInExercises';
import { Exercise } from '../../src/domain/training/Exercise';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { HealthSample } from '../../src/healthIngest/HealthSample';
import { AppState } from '../../src/state/AppState';
import { Loadable } from '../../src/state/Loadable';
import { settled, turn } from './support/settled';

/**
 * MM-232: what the Flutter app kept in its providers, as plain state over
 * the repositories. Flutter tested these through its screens; here they
 * are tested where they are worked out.
 */
const today = CalendarDate.of(2026, 10, 10);

function fresh(day: CalendarDate = today) {
  const repos = new InMemoryRepositories();
  const clock = new FixedClock(day);
  return { repos, clock, state: new AppState(servicesOf(repos, clock)) };
}

async function seeded(day: CalendarDate = today) {
  const made = fresh(day);
  const r = made.repos;
  await new DemoSeed(day).replace({
    eraser: r.eraser,
    setup: r.setup,
    weights: r.weights,
    waist: r.waist,
    food: r.food,
    dayMarks: r.dayMarks,
    targets: r.targets,
    recovery: r.recovery,
    workouts: r.workouts,
  });
  return made;
}

const entry = (date: CalendarDate, proteinG: number, meal: FoodEntry['meal'] = 'lunch') =>
  new FoodEntry({ id: 0, date, meal, name: 'Food', kcal: 400, proteinG, carbsG: 40, fatG: 10, source: 'weighed' });

describe('before onboarding', () => {
  it('the setup is ready and there is none, which is not the same as not loaded', async () => {
    const { state } = fresh();
    expect(state.setup.value).toEqual(Loadable.loading);
    expect(await settled(state.setup, (s) => s.ready)).toEqual({ ready: true, value: undefined });
  });

  it('there is no coach, no targets and no notice, and nothing is due', async () => {
    const { state } = fresh();
    await settled(state.setup, (s) => s.ready);
    expect(await settled(state.coach)).toBeUndefined();
    expect(await settled(state.currentTargets)).toBeUndefined();
    expect(await settled(state.underEatingNotice)).toBeUndefined();
    expect(await settled(state.reportPeriods)).toEqual([]);
    expect(await settled(state.recoveryCheckInDue)).toBe(false);
  });

  it('every reminder is off at its default time, and the phone is not asked to schedule anything', async () => {
    const { state } = fresh();
    const settings = await settled(state.reminderSettings);
    expect(settings.map((s) => s.kind)).toEqual(ReminderKind.values);
    expect(settings.every((s) => !s.enabled)).toBe(true);
    await settled(state.reminders, (r) => r.ready);
    expect(await settled(state.reminderPlan)).toBeUndefined();
  });
});

describe('with ten weeks of history', () => {
  it('the coach has a view, and the targets in force are the latest issued', async () => {
    const { state } = await seeded();
    const coach = await settled(state.coach, (c) => c !== undefined);
    expect(coach?.policy.targetsAllowed).toBe(true);
    expect(coach?.trend.length).toBeGreaterThan(0);
    const targets = await settled(state.currentTargets, (t) => t !== undefined);
    expect(targets?.effectiveFrom).toBe(today);
    expect(targets?.targets.kcal).toBe(2200);
  });

  it('the week is summed up, the streak is counted and the guide for a paused day is maintenance', async () => {
    const { state } = await seeded();
    const summary = await settled(state.adherenceSummary, (s) => s !== undefined);
    expect(summary?.daysLogged).toBe(7);
    expect(summary?.completeDays).toBe(7);
    expect((await settled(state.loggingStreak, (s) => s.days > 0)).days).toBeGreaterThanOrEqual(7);
    const guide = await settled(state.maintenanceGuide, (g) => g !== undefined);
    expect(guide?.kcal).toBeGreaterThan(2200);
  });

  it('two monthly reports are ready and can be built', async () => {
    const { state } = await seeded();
    const periods = await settled(state.reportPeriods, (p) => p.length > 0);
    expect(periods.length).toBe(2);
    const report = await settled(state.monthlyReport(0), (r) => r !== undefined);
    expect(report?.period).toEqual(periods[0]);
    expect(report?.daysLogged).toBe(28);
    expect(await settled(state.monthlyReport(5))).toBeUndefined();
  });

  it('a pause over today is the active one, and a paused week is not summed up', async () => {
    const { state, repos } = await seeded();
    await settled(state.adherenceSummary, (s) => s !== undefined);
    expect(await settled(state.activePause)).toBeUndefined();
    await repos.pauses.savePause(new Pause({ from: today.addDays(-2), to: today.addDays(4), reason: 'travel' }));
    expect((await settled(state.activePause, (p) => p !== undefined))?.reason).toBe('travel');
    expect(await settled(state.adherenceSummary, (s) => s === undefined)).toBeUndefined();
    const judged = await settled(state.judgedIntake, (days) => days !== undefined && days.every((d) => d.date.isBefore(today.addDays(-2))));
    expect(judged?.length).toBe(58);
  });

  it('protein is added up by meal for each of the fourteen days before today', async () => {
    const { state } = await seeded();
    const byDay = await settled(state.mealProtein, (m) => m.size === 14);
    expect([...byDay.keys()].some((d) => d === today)).toBe(false);
    const yesterday = byDay.get(today.addDays(-1));
    expect([yesterday?.get('breakfast'), yesterday?.get('lunch'), yesterday?.get('dinner'), yesterday?.get('snack')]).toEqual([
      40, 55, 50, 15,
    ]);
  });
});

describe('the day', () => {
  it('rolls over when the app comes back after midnight, and what is read moves with it', async () => {
    const { state, repos, clock } = fresh();
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-100) }));
    await repos.food.addFood(entry(today.addDays(-60), 30));
    const stop = state.intakeDays.subscribe(() => undefined);
    expect((await settled(state.intakeDays, (d) => d.ready && d.value.length === 1)).ready).toBe(true);

    clock.advanceTo(today.addDays(1));
    expect(state.today.value).toBe(today);
    state.refreshToday();
    expect(state.today.value).toBe(today.addDays(1));
    // Sixty days before the new day no longer reaches that entry.
    await settled(state.intakeDays, (d) => d.ready && d.value.length === 0);
    stop();
  });

  it('one day’s food and its mark follow the log', async () => {
    const { state, repos } = fresh();
    const food = state.foodForDay(today);
    expect(state.foodForDay(today)).toBe(food);
    const stop = food.subscribe(() => undefined);
    await settled(food, (f) => f.ready);
    await repos.food.addFood(entry(today, 30));
    await repos.food.addFood(entry(today.addDays(-1), 30));
    expect(Loadable.valueOf(await settled(food, (f) => f.ready && f.value.length === 1))?.length).toBe(1);
    stop();

    await repos.dayMarks.setCompleteness(today, 'complete');
    expect(await settled(state.completeness(today), (c) => c.ready)).toEqual({ ready: true, value: 'complete' });
  });
});

describe('weigh-ins', () => {
  const sample = (id: string, day: CalendarDate, kg: number): HealthSample => ({
    platformId: id,
    type: 'weight',
    value: kg,
    start: new Date(day.year, day.month - 1, day.day, 6, 30),
    sourceId: 'scale',
    sourceName: 'Bathroom scale',
  });

  it('are what was typed and, for other days, what was imported; an import is picked up when it is announced', async () => {
    const { state, repos } = fresh();
    await repos.weights.saveWeight(today, 81);
    const stop = state.weights.subscribe(() => undefined);
    await settled(state.weights, (w) => w.ready && w.value.length === 1);

    await repos.healthSamples.upsert([sample('w-1', today.addDays(-1), 82.4), sample('w-2', today, 99)]);
    await turn();
    expect(Loadable.valueOf(state.weights.value)?.length, 'not read again until told').toBe(1);

    state.healthImported();
    const merged = await settled(state.weights, (w) => w.ready && w.value.length === 2);
    expect(Loadable.valueOf(merged)?.map((w) => w.weightKg)).toEqual([82.4, 81]);
    expect(Loadable.valueOf(await settled(state.typedWeights, (w) => w.ready))?.length).toBe(1);
    stop();
  });
});

describe('exercises', () => {
  it('are the built-in library and then the user’s own, findable by id', async () => {
    const { state, repos } = fresh();
    const id = await repos.customExercises.saveCustomExercise(
      new Exercise({ id: '', name: 'Ring dip', equipment: 'other', primary: 'chest' }),
    );
    const all = await settled(state.exercises, (e) => e.length > builtInExercises.length);
    expect(all.length).toBe(builtInExercises.length + 1);
    expect(all[all.length - 1]?.name).toBe('Ring dip');
    const byId = await settled(state.exercisesById, (m) => m.has(id));
    expect(byId.get(id)?.name).toBe('Ring dip');
    expect(byId.get('back-squat')?.name).toBe('Back squat');
  });
});

describe('reminders', () => {
  it('a stored setting replaces the default, and turning one on gives the phone a plan', async () => {
    const { state, repos } = fresh();
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30) }));
    await repos.reminders.saveReminder(
      new ReminderSetting({ kind: 'weighIn', enabled: true, minuteOfDay: 20 * 60, countFrom: today }),
    );
    const settings = await settled(state.reminderSettings, (s) => s.some((setting) => setting.enabled));
    expect(settings.map((s) => [s.kind, s.enabled])).toEqual([
      ['weighIn', true],
      ['logFood', false],
      ['weeklyMeasurement', false],
    ]);
    const plan = await settled(state.reminderPlan, (p) => p !== undefined);
    expect(plan?.length).toBeGreaterThan(0);
    expect(plan?.every((planned) => planned.kind === 'weighIn')).toBe(true);
    expect(await settled(state.selfPausedReminders)).toEqual([]);
  });
});

describe('the hand', () => {
  it('is sized from the profile once there is one', async () => {
    const { state, repos } = fresh();
    expect(await settled(state.handSize)).toBeUndefined();
    await repos.setup.saveSetup(typicalSetup({ sex: 'female' }));
    expect(await settled(state.handSize, (h) => h !== undefined)).toEqual({ heightCm: 180, sex: 'female' });
  });
});
