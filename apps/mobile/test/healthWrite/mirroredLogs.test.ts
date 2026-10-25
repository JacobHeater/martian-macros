import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryHealthWorkouts } from '../../src/fixtures/InMemoryHealthWorkouts';
import { InMemoryHealthWriting } from '../../src/fixtures/InMemoryHealthWriting';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { MirroredFoodLog } from '../../src/healthWrite/MirroredFoodLog';
import { MirroredWaterLog } from '../../src/healthWrite/MirroredWaterLog';
import { MirroredWeightLog } from '../../src/healthWrite/MirroredWeightLog';
import { MirroredWorkoutLog } from '../../src/healthWrite/MirroredWorkoutLog';
import { RenewingEraser } from '../../src/healthWrite/RenewingEraser';
import { RenewingRestorer } from '../../src/healthWrite/RenewingRestorer';
import { workoutFromPlatform } from '../../src/engine/workoutFromPlatform';
import { FakeDataRestorer } from '../../src/fixtures/FakeDataRestorer';
import { dataEraserContract } from '../contracts/dataEraserContract';
import { foodRepositoryContract } from '../contracts/foodRepositoryContract';
import { waterRepositoryContract } from '../contracts/waterRepositoryContract';
import { weightRepositoryContract } from '../contracts/weightRepositoryContract';
import { workoutRepositoryContract } from '../contracts/workoutRepositoryContract';
import { first } from '../support/first';

/** MM-70, MM-314, MM-513, MM-489: the logs as the app takes them on a phone, told to the health platform as they change. */
const writingOn = () => new InMemoryHealthWriting({ on: ['food', 'water', 'weight', 'workouts'] });

foodRepositoryContract('The food log told to the health platform', () => {
  return new MirroredFoodLog({ log: new InMemoryRepositories().food, platform: writingOn() });
});
waterRepositoryContract('The water log told to the health platform', () => {
  return new MirroredWaterLog({ log: new InMemoryRepositories().water, platform: writingOn() });
});
weightRepositoryContract('The weigh-ins told to the health platform', () => {
  return new MirroredWeightLog({
    log: new InMemoryRepositories().weights,
    platform: writingOn(),
    clock: new FixedClock(CalendarDate.of(2026, 1, 2)),
  });
});
workoutRepositoryContract('The workout log told to the health platform', async () => {
  const repos = new InMemoryRepositories();
  const platform = new InMemoryHealthWorkouts({ namesExercises: true });
  await platform.requestWritePermission();
  return new MirroredWorkoutLog({
    log: repos.workouts,
    platform,
    customExercises: repos.customExercises,
    ids: new InMemoryHealthWriting(),
  });
});

const today = CalendarDate.of(2026, 10, 5);
const lunch = (kcal: number, id = 0) =>
  new FoodEntry({
    id,
    date: today,
    meal: 'lunch',
    name: 'Chicken and rice',
    kcal,
    proteinG: 40,
    carbsG: 55,
    fatG: 14,
    source: 'weighed',
    fiberG: 4,
    micros: new Micronutrients({ sugars: 3 }),
  });

describe('food (MM-70)', () => {
  const setUp = (on: boolean) => {
    const platform = on ? writingOn() : new InMemoryHealthWriting();
    const repos = new InMemoryRepositories();
    return { platform, repos, food: new MirroredFoodLog({ log: repos.food, platform }) };
  };

  it('A logged food appears: 510 kcal at its meal, from the app, with what the entry states', async () => {
    const { platform, food } = setUp(true);
    const id = await food.addFood(lunch(510));
    const written = platform.nutrition.get(`martian-macros-food-ns1-${id}`);
    expect(written).toMatchObject({ kcal: 510, proteinG: 40, meal: 'lunch', fiberG: 4, sugarsG: 3, name: 'Chicken and rice' });
    expect(written?.start).toEqual(new Date(2026, 9, 5, 12, 30));
    expect(written?.end.getTime()).toBeGreaterThan(written!.start.getTime());
    expect(written?.sodiumMg).toBeUndefined();
    expect(written?.saturatedFatG).toBeUndefined();
  });

  it('MM-570: a food with a time eaten is written at that time, on its own day', async () => {
    const { platform, food } = setUp(true);
    const id = await food.addFood(
      new FoodEntry({ id: 0, date: today, meal: 'lunch', name: 'Soup', kcal: 300, proteinG: 10, carbsG: 30, fatG: 8, source: 'weighed', eatenAt: 13 * 60 + 7 }),
    );
    expect(platform.nutrition.get(`martian-macros-food-ns1-${id}`)?.start).toEqual(new Date(2026, 9, 5, 13, 7));
  });

  it('An edit is mirrored: changed to 450 kcal, the platform has 450, not 960', async () => {
    const { platform, food } = setUp(true);
    const id = await food.addFood(lunch(510));
    await food.updateFood(lunch(450, id));
    expect([...platform.nutrition.values()].map((record) => record.kcal)).toEqual([450]);
  });

  it('A deletion is mirrored: the entry deleted is gone from the platform', async () => {
    const { platform, food } = setUp(true);
    const id = await food.addFood(lunch(510));
    await food.deleteFood(id);
    expect(platform.nutrition.size).toBe(0);
  });

  it('while writing food is off, logging works as before and nothing is written', async () => {
    const { platform, repos, food } = setUp(false);
    await food.addFood(lunch(510));
    expect((await first(repos.food.watchFood(today))).map((entry) => entry.kcal)).toEqual([510]);
    expect(platform.nutrition.size).toBe(0);
  });

  it('a platform that fails leaves the log as it was saved', async () => {
    const repos = new InMemoryRepositories();
    const failing = writingOn();
    failing.writeNutrition = () => Promise.reject(new Error('The platform is busy.'));
    const food = new MirroredFoodLog({ log: repos.food, platform: failing });
    await food.addFood(lunch(510));
    expect((await first(repos.food.watchFood(today))).map((entry) => entry.kcal)).toEqual([510]);
  });
});

describe('water (MM-314)', () => {
  const glass = new WaterEntry({ id: 0, date: today, ml: 250, at: new Date(2026, 9, 5, 9, 15) });

  it('Written: a glass logged is a 250 ml record at that time', async () => {
    const platform = writingOn();
    const water = new MirroredWaterLog({ log: new InMemoryRepositories().water, platform });
    const id = await water.addWater(glass);
    expect(platform.water.get(`martian-macros-water-ns1-${id}`)).toEqual({
      id: `martian-macros-water-ns1-${id}`,
      at: new Date(2026, 9, 5, 9, 15),
      ml: 250,
    });
  });

  it('Removed: the entry removed in the app is removed from the platform', async () => {
    const platform = writingOn();
    const water = new MirroredWaterLog({ log: new InMemoryRepositories().water, platform });
    const id = await water.addWater(glass);
    await water.removeWater(id);
    expect(platform.water.size).toBe(0);
  });

  it('Not allowed: logging water works as before and nothing is written', async () => {
    const platform = new InMemoryHealthWriting({ on: ['food'] });
    const repos = new InMemoryRepositories();
    const water = new MirroredWaterLog({ log: repos.water, platform });
    await water.addWater(glass);
    expect((await first(repos.water.watchWater(today))).map((entry) => entry.ml)).toEqual([250]);
    expect(platform.water.size).toBe(0);
  });
});

describe('weight (MM-513)', () => {
  const setUp = (platform: InMemoryHealthWriting) => {
    const repos = new InMemoryRepositories();
    const clock = new FixedClock(today, { hour: 7 });
    return { repos, weights: new MirroredWeightLog({ log: repos.weights, platform, clock }) };
  };

  it('A typed weight appears: 82.4 kg typed for today is written at the moment it is typed', async () => {
    const platform = writingOn();
    await setUp(platform).weights.saveWeight(today, 82.4);
    expect(platform.weight.get('martian-macros-weight-ns1-2026-10-05')).toEqual({
      id: 'martian-macros-weight-ns1-2026-10-05',
      at: new Date(2026, 9, 5, 7),
      kg: 82.4,
    });
  });

  it('changed, it is written again under its day, and removed, it is removed', async () => {
    const platform = writingOn();
    const { weights } = setUp(platform);
    await weights.saveWeight(today, 82.4);
    await weights.saveWeight(today, 82.1);
    expect([...platform.weight.values()].map((record) => record.kg)).toEqual([82.1]);
    await weights.deleteWeight(today);
    expect(platform.weight.size).toBe(0);
  });

  it('a weigh-in typed for an earlier day is written in that day’s morning', async () => {
    const platform = writingOn();
    await setUp(platform).weights.saveWeight(today.addDays(-2), 83);
    expect(platform.weight.get('martian-macros-weight-ns1-2026-10-03')?.at).toEqual(new Date(2026, 9, 3, 8, 0));
  });

  it('Off: typing a weight writes nothing, and the weigh-in is saved', async () => {
    const platform = new InMemoryHealthWriting({ on: ['food', 'water', 'workouts'] });
    const { repos, weights } = setUp(platform);
    await weights.saveWeight(today, 82.4);
    expect(platform.weight.size).toBe(0);
    expect((await first(repos.weights.watchWeights())).map((w) => w.weightKg)).toEqual([82.4]);
  });

  it('a platform that fails leaves the weigh-in as it was saved', async () => {
    const failing = writingOn();
    failing.writeWeight = () => Promise.reject(new Error('The platform is busy.'));
    const { repos, weights } = setUp(failing);
    await weights.saveWeight(today, 82.4);
    expect((await first(repos.weights.watchWeights())).map((w) => w.weightKg)).toEqual([82.4]);
  });
});

describe('workouts (MM-489)', () => {
  const at = (minute: number) => new Date(2026, 9, 5, 18, minute);
  const bench = new WorkoutExercise({
    exerciseId: 'barbell-bench-press',
    sets: [new WorkoutSet({ reps: 8, loadKg: 60, rir: 2, startedAt: at(5), endedAt: at(6) })],
  });
  const started = new Workout({ id: 0, date: today, startedAt: at(0), exercises: [bench] });

  const setUp = async (permit: boolean) => {
    const repos = new InMemoryRepositories();
    const platform = new InMemoryHealthWorkouts({ namesExercises: true });
    if (permit) await platform.requestWritePermission();
    const ids = new InMemoryHealthWriting();
    return {
      platform,
      ids,
      repos,
      workouts: new MirroredWorkoutLog({ log: repos.workouts, platform, customExercises: repos.customExercises, ids }),
    };
  };

  it('a workout in progress is not written; finished, it is, with its timed set', async () => {
    const { platform, workouts } = await setUp(true);
    const id = await workouts.saveWorkout(started);
    expect(platform.all).toEqual([]);
    await workouts.saveWorkout(started.copyWith({ id, endedAt: at(45) }));
    expect(platform.all).toHaveLength(1);
    expect(platform.all[0]?.clientId).toBe(`martian-macros-workout-ns1-${id}`);
    expect(platform.all[0]?.segments).toHaveLength(1);
  });

  it('Written once: a finished workout edited and saved again is one workout on the platform', async () => {
    const { platform, workouts } = await setUp(true);
    const id = await workouts.saveWorkout(started);
    const finished = started.copyWith({ id, endedAt: at(45) });
    await workouts.saveWorkout(finished);
    await workouts.saveWorkout(finished.copyWith({ endedAt: at(50) }));
    expect(platform.all).toHaveLength(1);
    expect(platform.all[0]?.end).toEqual(at(50));
  });

  it('Removed (MM-515): a finished workout deleted in the app is gone from the platform', async () => {
    const { platform, workouts } = await setUp(true);
    const id = await workouts.saveWorkout(started);
    await workouts.saveWorkout(started.copyWith({ id, endedAt: at(45) }));
    const kept = await workouts.saveWorkout(started.copyWith({ id: 0, endedAt: at(40) }));
    expect(platform.all).toHaveLength(2);
    await workouts.deleteWorkout(id);
    expect(platform.all.map((w) => w.clientId)).toEqual([`martian-macros-workout-ns1-${kept}`]);
    expect((await first(workouts.watchWorkouts())).map((w) => w.id)).toEqual([kept]);
  });

  it('MM-490: a workout imported from the platform is never written back, finished or edited', async () => {
    const { platform, workouts } = await setUp(true);
    const imported = started.copyWith({ endedAt: at(45) });
    const fromWatch = new Workout({
      id: 0,
      date: today,
      startedAt: imported.startedAt,
      endedAt: imported.endedAt,
      exercises: imported.exercises,
      imported: { platformId: 'hc-1', sourceName: 'Watch' },
    });
    const id = await workouts.saveWorkout(fromWatch);
    await workouts.saveWorkout(fromWatch.copyWith({ id, endedAt: at(50) }));
    expect(platform.all).toEqual([]);
    await workouts.deleteWorkout(id);
    expect(await workouts.deletedPlatformIds()).toEqual(new Set(['hc-1']));
  });

  it('Off (MM-515): with writing workouts not allowed, deleting a workout asks nothing of the platform', async () => {
    const { platform, workouts } = await setUp(false);
    const removals: string[] = [];
    platform.removeWorkout = (clientId) => {
      removals.push(clientId);
      return Promise.resolve(true);
    };
    const id = await workouts.saveWorkout(started.copyWith({ endedAt: at(45) }));
    await workouts.deleteWorkout(id);
    expect(removals).toEqual([]);
  });

  it('Writing asks for its own permission: not granted, nothing is written and the workout is saved', async () => {
    const { platform, workouts } = await setUp(false);
    const id = await workouts.saveWorkout(started);
    await workouts.saveWorkout(started.copyWith({ id, endedAt: at(45) }));
    expect(platform.all).toEqual([]);
    expect((await first(workouts.watchWorkouts()))[0]?.endedAt).toEqual(at(45));
  });
});

// MM-522: "Erase all data" starts entry ids again; what is written after must never replace what was written before.
dataEraserContract('Erasing that renews the write namespace', () => {
  const r = new InMemoryRepositories();
  return {
    eraser: new RenewingEraser({ eraser: r.eraser, ids: new InMemoryHealthWriting() }),
    setup: r.setup,
    weights: r.weights,
    weightEvents: r.weightEvents,
    food: r.food,
    targets: r.targets,
    preferences: r.preferences,
    weighInWindow: r.weighInWindow,
    workouts: r.workouts,
    customExercises: r.customExercises,
    targetShapes: r.targetShapes,
    goalBodyFat: r.goalBodyFat,
    dayKinds: r.dayKinds,
    trendLog: r.trendLog,
    adviceRecord: r.adviceRecord,
    measurements: r.measurements,
    measurementSettings: r.measurementSettings,
  };
});

describe('ids across an erase (MM-522)', () => {
  it('a food logged after an erase, with the id an older one had, is a record of its own', async () => {
    const platform = writingOn();
    const before = new InMemoryRepositories();
    const firstId = await new MirroredFoodLog({ log: before.food, platform }).addFood(lunch(510));
    await new RenewingEraser({ eraser: before.eraser, ids: platform }).eraseAll();
    // A fresh log gives its first entry the first id again, as after an erase.
    const after = new InMemoryRepositories();
    const secondId = await new MirroredFoodLog({ log: after.food, platform }).addFood(lunch(300));
    expect(secondId).toBe(firstId);
    expect([...platform.nutrition.values()].map((record) => record.kcal).sort()).toEqual([300, 510]);
  });

  it('a drink logged after an erase never replaces one from before it', async () => {
    const platform = writingOn();
    const glass = new WaterEntry({ id: 0, date: today, ml: 250, at: new Date(2026, 9, 5, 9, 15) });
    const before = new InMemoryRepositories();
    await new MirroredWaterLog({ log: before.water, platform }).addWater(glass);
    await new RenewingEraser({ eraser: before.eraser, ids: platform }).eraseAll();
    await new MirroredWaterLog({ log: new InMemoryRepositories().water, platform }).addWater(glass);
    expect(platform.water.size).toBe(2);
  });

  it('a restore renews the namespace too', async () => {
    const ids = new InMemoryHealthWriting();
    const before = await ids.writeNamespace();
    await new RenewingRestorer({ restorer: new FakeDataRestorer(), ids }).restoreFrom(new Uint8Array());
    expect(await ids.writeNamespace()).not.toBe(before);
  });

  it('a workout written after an erase is a workout of its own, and every namespace is still known as the app’s', async () => {
    const at = (minute: number) => new Date(2026, 9, 5, 18, minute);
    const finished = new Workout({ id: 0, date: today, startedAt: at(0), exercises: [] });
    const platform = new InMemoryHealthWorkouts({ namesExercises: true });
    await platform.requestWritePermission();
    const ids = new InMemoryHealthWriting();
    for (let run = 0; run < 2; run++) {
      const repos = new InMemoryRepositories();
      const log = new MirroredWorkoutLog({ log: repos.workouts, platform, customExercises: repos.customExercises, ids });
      const id = await log.saveWorkout(finished);
      await log.saveWorkout(finished.copyWith({ id, endedAt: at(45) }));
      await new RenewingEraser({ eraser: repos.eraser, ids }).eraseAll();
    }
    expect(platform.all).toHaveLength(2);
    for (const written of platform.all) expect(workoutFromPlatform(written)).toBeUndefined();
  });
});
