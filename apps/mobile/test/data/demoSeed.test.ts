import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { DataEraser } from '../../src/domain/repositories/DataEraser';
import type { DayMarkRepository } from '../../src/domain/repositories/DayMarkRepository';
import type { FoodRepository } from '../../src/domain/repositories/FoodRepository';
import type { IntakeReader } from '../../src/domain/repositories/IntakeReader';
import type { RecoveryCheckInRepository } from '../../src/domain/repositories/RecoveryCheckInRepository';
import type { SetupRepository } from '../../src/domain/repositories/SetupRepository';
import type { WaistRepository } from '../../src/domain/repositories/WaistRepository';
import type { WeightRepository } from '../../src/domain/repositories/WeightRepository';
import type { WorkoutRepository } from '../../src/domain/repositories/WorkoutRepository';
import { builtInExercises } from '../../src/domain/training/builtInExercises';
import { buildStrengthTrends } from '../../src/engine/buildStrengthTrends';
import type { TargetsHistoryRepository } from '../../src/engine/TargetsHistoryRepository';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { first } from '../support/first';
import { single } from '../support/single';
import { openRepositories } from './support/openRepositories';

/** Carried over from the Flutter app's `demo_seed_test.dart`. */
interface Seeded {
  eraser: DataEraser;
  setup: SetupRepository;
  weights: WeightRepository;
  waist: WaistRepository;
  food: FoodRepository;
  dayMarks: DayMarkRepository;
  intake: IntakeReader;
  targets: TargetsHistoryRepository;
  recovery: RecoveryCheckInRepository;
  workouts: WorkoutRepository;
}

async function exerciseDemoSeed(r: Seeded): Promise<void> {
  const today = CalendarDate.of(2026, 10, 10);
  const seed = (day: CalendarDate) =>
    new DemoSeed(day).replace({
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

  await seed(today);
  const initialWorkouts = await first(r.workouts.watchWorkouts());
  expect(initialWorkouts.length).toBe(15);
  const strength = buildStrengthTrends({
    workouts: initialWorkouts,
    exercises: builtInExercises,
    weights: await first(r.weights.watchWeights()),
    today,
  });
  expect(strength.length).toBe(5);
  expect(strength.filter((t) => t.recentSessions > 0).length).toBe(4);
  expect(strength[0]?.changeOverDays(84)).toBeDefined();
  expect(strength[4]?.points).toEqual([]);

  const initialWeights = await first(r.weights.watchWeights());
  const initialDays = await first(r.intake.watchIntakeDays({ since: today.addDays(-100) }));
  expect(initialWeights.length).toBe(71);
  expect(initialWeights[0]?.date).toBe(today.addDays(-70));
  expect(initialWeights[70]?.date).toBe(today);
  expect(initialWeights[70]?.weightKg).toBeLessThan(initialWeights[0]?.weightKg ?? 0);
  expect(initialDays.length).toBe(71);
  expect(initialDays.slice(0, 70).every((d) => d.completeness === 'complete')).toBe(true);
  expect(initialDays[70]?.completeness).toBe('partial');
  expect(initialDays[70]?.kcal).toBeLessThan(1000);
  expect((await first(r.food.watchFood(today))).length).toBe(3);
  expect((await first(r.food.watchFood(today.addDays(-1)))).length).toBe(4);
  expect((await first(r.waist.watchWaist())).length).toBe(11);
  expect((await first(r.recovery.watchRecoveryCheckIns())).length).toBe(11);
  const history = await first(r.targets.watchTargetsHistory());
  expect(history.length).toBe(11);
  expect(history[10]?.effectiveFrom).toBe(today);
  expect(new Set(history.map((t) => t.targets.kcal)).size).toBeGreaterThan(1);
  expect((await r.setup.loadSetup())?.onboardedOn).toBe(today.addDays(-70));

  await r.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'snack',
      name: 'Discard this demo edit',
      kcal: 100,
      proteinG: 5,
      carbsG: 20,
      fatG: 0,
      source: 'quickAdd',
    }),
  );
  await seed(today);
  expect((await first(r.workouts.watchWorkouts())).map((w) => w.date)).toEqual(initialWorkouts.map((w) => w.date));
  expect((await first(r.food.watchFood(today))).length).toBe(3);
  expect((await first(r.weights.watchWeights())).map((w) => w.weightKg)).toEqual(initialWeights.map((w) => w.weightKg));
  expect((await first(r.intake.watchIntakeDays({ since: today.addDays(-100) }))).map((d) => d.kcal)).toEqual(
    initialDays.map((d) => d.kcal),
  );

  await seed(today.addDays(1));
  const shifted = await first(r.weights.watchWeights());
  expect(shifted.length).toBe(71);
  expect(shifted[0]?.date).toBe(today.addDays(-69));
  expect(shifted[70]?.date).toBe(today.addDays(1));
}

it('synthetic histories reset deterministically in fixtures', async () => {
  await exerciseDemoSeed(new InMemoryRepositories());
});

it('synthetic histories reset in SQLite without touching another store', async () => {
  const demo = await openRepositories();
  const normal = await openRepositories();
  const day = CalendarDate.of(2026, 10, 10);
  await normal.weights.saveWeight(day, 99);

  await exerciseDemoSeed(demo);

  expect(single(await first(normal.weights.watchWeights())).weightKg).toBe(99);
  expect(await normal.setup.loadSetup()).toBeUndefined();
}, 30_000);
