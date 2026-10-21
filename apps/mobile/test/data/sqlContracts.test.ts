import { expect, it } from 'vitest';
import { ExerciseProgression } from '../../src/domain/training/ExerciseProgression';
import { FakeHealthSource, HealthImporter, recordedHealthHistory } from '../../src/healthIngest';
import { customExerciseRepositoryContract } from '../contracts/customExerciseRepositoryContract';
import { customFoodRepositoryContract } from '../contracts/customFoodRepositoryContract';
import { dataEraserContract } from '../contracts/dataEraserContract';
import { dayMarkRepositoryContract } from '../contracts/dayMarkRepositoryContract';
import { exerciseProgressionRepositoryContract } from '../contracts/exerciseProgressionRepositoryContract';
import { foodRepositoryContract } from '../contracts/foodRepositoryContract';
import { healthBackfillMarksContract } from '../contracts/healthBackfillMarksContract';
import { healthSampleStoreContract } from '../contracts/healthSampleStoreContract';
import { inlineInsightLogRepositoryContract } from '../contracts/inlineInsightLogRepositoryContract';
import { insightLogRepositoryContract } from '../contracts/insightLogRepositoryContract';
import { insightSnoozeRepositoryContract } from '../contracts/insightSnoozeRepositoryContract';
import { intakeReaderContract } from '../contracts/intakeReaderContract';
import { pauseRepositoryContract } from '../contracts/pauseRepositoryContract';
import { preferencesRepositoryContract } from '../contracts/preferencesRepositoryContract';
import { recoveryCheckInRepositoryContract } from '../contracts/recoveryCheckInRepositoryContract';
import { reminderRepositoryContract } from '../contracts/reminderRepositoryContract';
import { setupRepositoryContract } from '../contracts/setupRepositoryContract';
import { sleepRepositoryContract } from '../contracts/sleepRepositoryContract';
import { targetShapeRepositoryContract } from '../contracts/targetShapeRepositoryContract';
import { targetsHistoryRepositoryContract } from '../contracts/targetsHistoryRepositoryContract';
import { menstruationRepositoryContract } from '../contracts/menstruationRepositoryContract';
import { waistRepositoryContract } from '../contracts/waistRepositoryContract';
import { waterRepositoryContract } from '../contracts/waterRepositoryContract';
import { weightEventRepositoryContract } from '../contracts/weightEventRepositoryContract';
import { weightRepositoryContract } from '../contracts/weightRepositoryContract';
import { workoutRepositoryContract } from '../contracts/workoutRepositoryContract';
import { first } from '../support/first';
import { openRepositories as open, openSql } from './support/openRepositories';
import { onlineFoodCacheContract } from '../contracts/onlineFoodCacheContract';
import { SqlOnlineFoodCache } from '../../src/foodCatalog/online/SqlOnlineFoodCache';
import { AppDatabase } from '../../src/data/AppDatabase';

/**
 * Runs every repository contract against the database's implementations.
 * The same suites run against the in-memory ones (test/fixtures), which is
 * what makes one substitutable for the other.
 */
setupRepositoryContract('SQLite', async () => (await open()).setup);
weightRepositoryContract('SQLite', async () => (await open()).weights);
weightEventRepositoryContract('SQLite', async () => (await open()).weightEvents);
waistRepositoryContract('SQLite', async () => (await open()).waist);
menstruationRepositoryContract('SQLite', async () => (await open()).flowDays);
onlineFoodCacheContract('SQLite', async () => {
  const sql = await openSql();
  await AppDatabase.open(sql);
  return new SqlOnlineFoodCache(sql);
});
sleepRepositoryContract('SQLite', async () => (await open()).sleep);
waterRepositoryContract('SQLite', async () => (await open()).water);
preferencesRepositoryContract('SQLite', async () => (await open()).preferences);
foodRepositoryContract('SQLite', async () => (await open()).food);
customFoodRepositoryContract('SQLite', async () => (await open()).customFoods);
dayMarkRepositoryContract('SQLite', async () => (await open()).dayMarks);
targetsHistoryRepositoryContract('SQLite', async () => (await open()).targets);
targetShapeRepositoryContract('SQLite', async () => (await open()).targetShapes);
insightLogRepositoryContract('SQLite', async () => (await open()).insightLog);
inlineInsightLogRepositoryContract('SQLite', async () => (await open()).inlineInsightLog);
insightSnoozeRepositoryContract('SQLite', async () => (await open()).insightSnoozes);
pauseRepositoryContract('SQLite', async () => (await open()).pauses);
reminderRepositoryContract('SQLite', async () => (await open()).reminders);
recoveryCheckInRepositoryContract('SQLite', async () => (await open()).recovery);
workoutRepositoryContract('SQLite', async () => (await open()).workouts);
customExerciseRepositoryContract('SQLite', async () => (await open()).customExercises);
exerciseProgressionRepositoryContract('SQLite', async () => (await open()).exerciseProgressions);
healthSampleStoreContract('SQLite', async () => (await open()).healthSamples);
healthBackfillMarksContract('SQLite', async () => (await open()).healthSamples);
intakeReaderContract('SQLite', async () => {
  const r = await open();
  return { food: r.food, marks: r.dayMarks, intake: r.intake };
});
dataEraserContract('SQLite', async () => {
  const r = await open();
  return {
    eraser: r.eraser,
    setup: r.setup,
    weights: r.weights,
    weightEvents: r.weightEvents,
    food: r.food,
    targets: r.targets,
    targetShapes: r.targetShapes,
    preferences: r.preferences,
    workouts: r.workouts,
    customExercises: r.customExercises,
  };
});

it('erasing empties the rep ranges and load steps', async () => {
  const repos = await open();
  await repos.exerciseProgressions.saveExerciseProgression(
    new ExerciseProgression({ exerciseId: 'back-squat', repsLow: 3, repsHigh: 6 }),
  );
  await repos.eraser.eraseAll();
  expect(await first(repos.exerciseProgressions.watchExerciseProgressions())).toEqual([]);
});

it('importing into the database twice does not duplicate, and erasing empties it', async () => {
  const repos = await open();
  const source = FakeHealthSource.fromJson(recordedHealthHistory, { happened: 9 });
  await source.permit();
  const importer = new HealthImporter({ source, store: repos.healthSamples });
  await importer.import('weight');
  source.letAllHappen();
  await importer.import('weight');
  await importer.import('weight');
  expect((await repos.healthSamples.samples('weight')).map((s) => s.platformId)).toEqual([
    'w-1',
    'w-3',
    'w-4',
    'w-5',
    'w-6',
  ]);
  await repos.eraser.eraseAll();
  expect(await repos.healthSamples.samples('weight')).toEqual([]);
  expect(await repos.healthSamples.token('weight')).toBeUndefined();
});
