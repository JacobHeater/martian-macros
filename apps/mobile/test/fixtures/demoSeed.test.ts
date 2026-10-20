import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { builtInExercises } from '../../src/domain/training/builtInExercises';
import { buildStrengthTrends } from '../../src/engine/buildStrengthTrends';
import { personalRecordsOf } from '../../src/engine/personalRecordsOf';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { first } from '../support/first';

// Added in the move. The Flutter app's own test of the seed is carried over in test/data/demoSeed.test.ts,
// where it also runs against the database; these pin the seeded values themselves.
const today = CalendarDate.of(2026, 10, 12);

async function seeded(): Promise<InMemoryRepositories> {
  const r = new InMemoryRepositories();
  await new DemoSeed(today).replace({
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
  return r;
}

it('seeds ten weeks ending today, with today left partly logged', async () => {
  const r = await seeded();
  const start = today.addDays(-DemoSeed.historyDays);
  expect((await r.setup.loadSetup())?.onboardedOn).toBe(start);

  const weights = await first(r.weights.watchWeights());
  expect(weights.length).toBe(71);
  expect(weights[0]?.date).toBe(start);
  expect(weights[70]?.date).toBe(today);
  expect(weights[0]?.weightKg).toBe(86);

  expect((await first(r.waist.watchWaist())).length).toBe(11);
  expect((await first(r.recovery.watchRecoveryCheckIns())).length).toBe(11);
  expect((await first(r.targets.watchTargetsHistory())).map((t) => t.targets.kcal)).toEqual([
    2300, 2300, 2300, 2300, 2250, 2250, 2250, 2250, 2200, 2200, 2200,
  ]);

  expect((await first(r.food.watchFood(today.addDays(-1)))).map((e) => e.meal)).toEqual([
    'breakfast',
    'lunch',
    'dinner',
    'snack',
  ]);
  // Today is partly logged: breakfast, a coffee and the snack (MM-289).
  expect((await first(r.food.watchFood(today))).map((e) => e.meal)).toEqual(['breakfast', 'snack', 'snack']);
  expect(await first(r.dayMarks.watchCompleteness(today))).toBe('partial');
  expect(await first(r.dayMarks.watchCompleteness(today.addDays(-1)))).toBe('complete');

  const days = await first(r.intake.watchIntakeDays({ since: start }));
  expect(days.length).toBe(71);
  // Each entry's energy is what its macros come to.
  for (const entry of await first(r.food.watchFood(start))) {
    expect(entry.kcal).toBe(entry.proteinG * 4 + entry.carbsG * 4 + entry.fatG * 9);
  }
});

it('seeds fifteen weekly workouts, newest today, and replaces what was there', async () => {
  const r = await seeded();
  const workouts = await first(r.workouts.watchWorkouts());
  expect(workouts.length).toBe(15);
  expect(workouts[0]?.date).toBe(today);
  expect(workouts[0]?.startedAt.getHours()).toBe(18);
  expect(workouts[0]?.inProgress).toBe(false);
  expect(workouts[0]?.exercises.map((e) => e.exerciseId)).toEqual([
    'barbell-bench-press',
    'back-squat',
    'barbell-row',
    'pull-up',
    'dumbbell-lateral-raise',
  ]);
  expect(workouts[14]?.exercises[0]?.sets[0]?.loadKg).toBe(70);
  // Five steps of 2.5 kg over fifteen weeks, the last one today (MM-289).
  expect(workouts[0]?.exercises[0]?.sets[0]?.loadKg).toBe(82.5);

  // Seeding again starts over: nothing is doubled.
  await new DemoSeed(today).replace({
    eraser: r.eraser,
    setup: r.setup,
    weights: r.weights,
    waist: r.waist,
    food: r.food,
    dayMarks: r.dayMarks,
    targets: r.targets,
    recovery: r.recovery,
  });
  expect((await first(r.weights.watchWeights())).length).toBe(71);
  expect((await first(r.food.watchFood(today.addDays(-1)))).length).toBe(4);
  expect(await first(r.workouts.watchWorkouts())).toEqual([]);
});

it('MM-289: the demo meals carry portions across the methods, three of them on today’s partly logged day', async () => {
  const r = await seeded();
  const today_ = await first(r.food.watchFood(today));
  expect(new Set(today_.map((entry) => entry.source)).size).toBeGreaterThanOrEqual(3);
  for (const entry of [...today_, ...(await first(r.food.watchFood(today.addDays(-1))))]) {
    expect(entry.portion?.method).toBe(entry.source);
  }
  const yesterday = await first(r.food.watchFood(today.addDays(-1)));
  expect(yesterday.map((entry) => entry.source)).toEqual(['householdMeasure', 'weighed', 'palm', 'labelServing']);
});

it('MM-289: the demo workouts vary, and a record is set one week in three', async () => {
  const r = await seeded();
  const workouts = await first(r.workouts.watchWorkouts());
  const trends = buildStrengthTrends({ workouts, exercises: builtInExercises, weights: await first(r.weights.watchWeights()), today });
  const records = personalRecordsOf(trends);
  const marked = workouts.filter((workout) => (records.get(workout.id)?.length ?? 0) > 0);
  const unmarked = workouts.filter((workout) => (records.get(workout.id)?.length ?? 0) === 0);
  // Weeks with a record and weeks without, both on the Train screen's first groups: the newest workout among the marked.
  expect(marked.length).toBeGreaterThanOrEqual(4);
  expect(unmarked.length).toBeGreaterThanOrEqual(marked.length);
  expect(marked[0]?.date).toBe(today);
  // Sets and lengths differ between a step week and the weeks after it.
  expect(new Set(workouts.map((workout) => workout.setCount)).size).toBeGreaterThan(1);
  expect(new Set(workouts.map((workout) => (workout.endedAt?.getTime() ?? 0) - workout.startedAt.getTime())).size).toBeGreaterThan(1);
});
