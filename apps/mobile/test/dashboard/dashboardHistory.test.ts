import { expect, it } from 'vitest';
import { DashboardHistory } from '../../src/dashboard/DashboardHistory';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { IntakeDay } from '../../src/domain/IntakeDay';
import { Pause } from '../../src/domain/Pause';
import { TargetShape } from '../../src/domain/TargetShape';
import type { WeightObservation } from '../../src/domain/WeightObservation';
import { WeekShape } from '../../src/domain/WeekShape';
import { DailyTargets } from '../../src/engine/DailyTargets';
import { TargetShapeLimits } from '../../src/engine/TargetShapeLimits';
import { TargetsRecord } from '../../src/engine/TargetsRecord';

/** Carried over from dashboard_history_test.dart. */
const today = CalendarDate.of(2026, 10, 10);

const food = (daysAgo: number, kcal: number, { complete = false }: { complete?: boolean } = {}) =>
  new IntakeDay({
    date: today.addDays(-daysAgo),
    kcal,
    proteinG: kcal / 15,
    carbsG: 200,
    fatG: 60,
    completeness: complete ? 'complete' : 'unmarked',
  });

const target = (daysAgo: number, kcal: number) =>
  new TargetsRecord({
    effectiveFrom: today.addDays(-daysAgo),
    mode: 'fatLoss',
    tdeeKcal: 2800,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
    targets: new DailyTargets({
      kcal,
      proteinG: 170,
      proteinMinimumG: 150,
      fatG: 70,
      carbsG: 250,
      weeklyRateFraction: -0.0075,
    }),
  });

const facts = ({
  days = 7,
  intake = [],
  history = [],
  pauses = [],
  weights = [],
  onboardedOn,
  allowed = true,
}: {
  days?: number;
  intake?: IntakeDay[];
  history?: TargetsRecord[];
  pauses?: Pause[];
  weights?: WeightObservation[];
  onboardedOn?: CalendarDate;
  allowed?: boolean;
} = {}) =>
  new DashboardHistory({
    today,
    days,
    intake,
    history,
    pauses,
    weights,
    onboardedOn: onboardedOn ?? today.addDays(-60),
    targetsAllowed: allowed,
  });

it('missing days are gaps; averages only include recorded days', () => {
  // Day 3 has nothing logged and is not marked complete: a gap, not a zero.
  const result = facts({ intake: [food(0, 1000, { complete: true }), food(2, 2000), food(3, 0)] });
  expect(result.calories.size).toBe(2);
  expect(result.calories.has(today.addDays(-1))).toBe(false);
  expect(result.calories.has(today.addDays(-3))).toBe(false);
  expect(result.meanCalories).toBe(1500);
  expect(result.meanProtein).toBe(100);
  // MM-176: each average says the days it uses, and gaps are not among them.
  expect(result.finishedDays).toBe(2);
  expect(result.proteinDays).toBe(2);
  expect(result.loggedDays).toBe(2);
  expect(result.activeDays).toBe(7);
});

it('inclusive range excludes older and future observations', () => {
  const result = facts({ intake: [food(6, 2000), food(7, 800), food(-1, 900)] });
  expect([...result.calories]).toEqual([[today.addDays(-6), 2000]]);
  expect(result.meanCalories).toBe(2000);
  expect(facts({ days: 30, intake: [food(7, 800)] }).calories.size).toBe(1);
});

it('empty averages are absent, never invented zero measurements', () => {
  const result = facts();
  expect(result.meanCalories).toBeUndefined();
  expect(result.meanProtein).toBeUndefined();
});

it('a deliberately completed zero-intake day is an observation', () => {
  const result = facts({ intake: [food(0, 0, { complete: true })] });
  expect(result.calories.get(today)).toBe(0);
  expect(result.completeDays).toBe(1);
});

it('uses targets in force per day, never backdates first targets', () => {
  const result = facts({ history: [target(4, 2400), target(1, 2300)] });
  expect(result.calorieTargets.get(today.addDays(-5))).toBeUndefined();
  expect(result.calorieTargets.get(today.addDays(-4))).toBe(2400);
  expect(result.calorieTargets.get(today.addDays(-1))).toBe(2300);
  expect(result.proteinTargets.get(today)).toBe(150);
});

it('paused observations stay visible but are not counted or targeted', () => {
  const result = facts({
    intake: [food(0, 2100, { complete: true }), food(1, 2000, { complete: true })],
    history: [target(7, 2300)],
    pauses: [new Pause({ from: today, to: today, reason: 'travel' })],
    weights: [{ date: today, weightKg: 80 }],
  });
  expect(result.calories.get(today)).toBe(2100);
  expect(result.activeDays).toBe(6);
  expect(result.loggedDays).toBe(1);
  expect(result.completeDays).toBe(1);
  expect(result.weighInDays).toBe(0);
  expect(result.calorieTargets.has(today)).toBe(false);
  // MM-176: the averages count the days the Logging row counts, so the paused day is left out.
  expect(result.finishedDays).toBe(1);
  expect(result.proteinDays).toBe(1);
  expect(result.meanCalories).toBe(2000);
  expect(result.pausedDays).toBe(1);
});

it('screening suppresses target comparisons, not logged facts', () => {
  const result = facts({ allowed: false, history: [target(7, 2300)], intake: [food(0, 2100)] });
  expect(result.calorieTargets.size).toBe(0);
  expect(result.proteinTargets.size).toBe(0);
  expect(result.calories.get(today)).toBe(2100);
});

it('coverage does not count days before onboarding', () => {
  const result = facts({ onboardedOn: today.addDays(-1), intake: [food(2, 2000), food(1, 2100), food(0, 2200)] });
  expect(result.activeDays).toBe(2);
  expect(result.loggedDays).toBe(2);
  // MM-335: today, not marked complete, is left out of the average.
  expect(result.meanCalories).toBe(2100);
});

it('MM-335: today still being logged is drawn apart and kept out of the averages until it is complete', () => {
  const unfinished = facts({ intake: [food(0, 600), food(1, 2000)] });
  expect(unfinished.unfinished).toBe(today);
  expect(unfinished.calories.get(today)).toBe(600);
  expect(unfinished.meanCalories).toBe(2000);
  expect(unfinished.finishedDays).toBe(1);
  const complete = facts({ intake: [food(0, 600, { complete: true }), food(1, 2000)] });
  expect(complete.unfinished).toBeUndefined();
  expect(complete.meanCalories).toBe(1300);
});

it('a shaped week draws each day against its own target, as Food shows it (MM-124)', () => {
  // Today is a Saturday: Saturday and Sunday 20% higher on 2,000 kcal.
  const week = new WeekShape({ higherDays: [6, 0], raise: 0.2 });
  const result = new DashboardHistory({
    today,
    days: 7,
    intake: [],
    history: [target(30, 2000)],
    pauses: [],
    weights: [],
    onboardedOn: today.addDays(-60),
    targetsAllowed: true,
    shapes: [new TargetShape({ since: today.addDays(-30), week })],
    limits: new TargetShapeLimits({ floorKcal: 1500, sex: 'male', trendWeightKg: 80, heightCm: 180 }),
  });
  expect(result.calorieTargets.get(today)).toBeCloseTo(2400, 6);
  expect(result.calorieTargets.get(today.addDays(-1))).toBeCloseTo(1840, 6);
  // Without the limits the line stays flat.
  expect(facts({ history: [target(30, 2000)] }).calorieTargets.get(today)).toBe(2000);
});
