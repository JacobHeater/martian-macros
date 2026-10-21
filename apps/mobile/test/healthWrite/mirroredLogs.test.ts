import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import { InMemoryHealthWorkouts } from '../../src/fixtures/InMemoryHealthWorkouts';
import { InMemoryHealthWriting } from '../../src/fixtures/InMemoryHealthWriting';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { MirroredFoodLog } from '../../src/healthWrite/MirroredFoodLog';
import { MirroredWaterLog } from '../../src/healthWrite/MirroredWaterLog';
import { MirroredWorkoutLog } from '../../src/healthWrite/MirroredWorkoutLog';
import { foodRepositoryContract } from '../contracts/foodRepositoryContract';
import { waterRepositoryContract } from '../contracts/waterRepositoryContract';
import { workoutRepositoryContract } from '../contracts/workoutRepositoryContract';
import { first } from '../support/first';

/** MM-70, MM-314, MM-489: the logs as the app takes them on a phone, told to the health platform as they change. */
const writingOn = () => new InMemoryHealthWriting({ on: ['food', 'water', 'workouts'] });

foodRepositoryContract('The food log told to the health platform', () => {
  return new MirroredFoodLog({ log: new InMemoryRepositories().food, platform: writingOn() });
});
waterRepositoryContract('The water log told to the health platform', () => {
  return new MirroredWaterLog({ log: new InMemoryRepositories().water, platform: writingOn() });
});
workoutRepositoryContract('The workout log told to the health platform', async () => {
  const repos = new InMemoryRepositories();
  const platform = new InMemoryHealthWorkouts({ namesExercises: true });
  await platform.requestWritePermission();
  return new MirroredWorkoutLog({ log: repos.workouts, platform, customExercises: repos.customExercises });
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
    const written = platform.nutrition.get(`martian-macros-food-${id}`);
    expect(written).toMatchObject({ kcal: 510, proteinG: 40, meal: 'lunch', fiberG: 4, sugarsG: 3, name: 'Chicken and rice' });
    expect(written?.start).toEqual(new Date(2026, 9, 5, 12, 30));
    expect(written?.end.getTime()).toBeGreaterThan(written!.start.getTime());
    expect(written?.sodiumMg).toBeUndefined();
    expect(written?.saturatedFatG).toBeUndefined();
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
    expect(platform.water.get(`martian-macros-water-${id}`)).toEqual({
      id: `martian-macros-water-${id}`,
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
    return { platform, workouts: new MirroredWorkoutLog({ log: repos.workouts, platform, customExercises: repos.customExercises }) };
  };

  it('a workout in progress is not written; finished, it is, with its timed set', async () => {
    const { platform, workouts } = await setUp(true);
    const id = await workouts.saveWorkout(started);
    expect(platform.all).toEqual([]);
    await workouts.saveWorkout(started.copyWith({ id, endedAt: at(45) }));
    expect(platform.all).toHaveLength(1);
    expect(platform.all[0]?.clientId).toBe(`martian-macros-workout-${id}`);
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

  it('Writing asks for its own permission: not granted, nothing is written and the workout is saved', async () => {
    const { platform, workouts } = await setUp(false);
    const id = await workouts.saveWorkout(started);
    await workouts.saveWorkout(started.copyWith({ id, endedAt: at(45) }));
    expect(platform.all).toEqual([]);
    expect((await first(workouts.watchWorkouts()))[0]?.endedAt).toEqual(at(45));
  });
});
