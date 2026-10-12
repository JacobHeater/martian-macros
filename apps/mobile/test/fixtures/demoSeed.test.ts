import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
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
  expect((await first(r.food.watchFood(today))).map((e) => e.meal)).toEqual(['breakfast']);
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
  expect(workouts[0]?.exercises[0]?.sets[0]?.loadKg).toBe(84);

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
