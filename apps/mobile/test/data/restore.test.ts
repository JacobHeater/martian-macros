import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { SqlRepositories } from '../../src/data/SqlRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import { valueOf } from '../../src/gallery/screens/valueOf';

/**
 * MM-63: a restore puts a backup's database in place of this phone's: every
 * setup field, weigh-in, food entry, mark and saved food is present after,
 * what was here before is gone, and the stores say so without a reopen.
 */
const today = CalendarDate.of(2026, 10, 19);

async function phone(): Promise<{ db: WasmSqlDatabase; repos: SqlRepositories }> {
  const db = await WasmSqlDatabase.open();
  return { db, repos: await SqlRepositories.open(db) };
}

it('round trip: a backup from one phone restored on another holds everything', async () => {
  const a = await phone();
  await a.repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await a.repos.weights.saveWeight(today.addDays(-1), 82.4);
  await a.repos.weights.saveWeight(today, 82.1);
  await a.repos.food.addFood(new FoodEntry({ id: 0, date: today, meal: 'breakfast', name: 'Oats', kcal: 389, proteinG: 17, carbsG: 66, fatG: 7, source: 'weighed' }));
  await a.repos.dayMarks.setCompleteness(today, 'complete');
  await a.repos.customFoods.saveCustomFood(
    new CustomFood({ id: 0, name: 'Protein oats', kind: 'food', servingDescription: '1 bowl', perServing: new NutritionTotals({ kcal: 410, proteinG: 24, carbsG: 52, fatG: 11 }) }),
  );
  await a.repos.preferences.saveWaterGoal(2500);
  const snapshot = await a.db.exportBytes();

  const b = await phone();
  await b.repos.weights.saveWeight(today.addDays(-10), 90);
  const weightsBefore = await valueOf(b.repos.weights.watchWeights());
  expect(weightsBefore).toHaveLength(1);

  const contents = await b.repos.restorer.describe(snapshot);
  expect(contents).toMatchObject({ weighIns: 2, foodDays: 1, customFoods: 1, hasSetup: true });
  expect(contents.from?.toString()).toBe(today.addDays(-1).toString());
  await b.repos.restorer.restoreFrom(snapshot);

  const weights = await valueOf(b.repos.weights.watchWeights());
  expect(weights.map((w) => [w.date.toString(), w.weightKg])).toEqual([
    [today.addDays(-1).toString(), 82.4],
    [today.toString(), 82.1],
  ]);
  expect((await valueOf(b.repos.setup.watchSetup()))?.onboardedOn.toString()).toBe(today.addDays(-40).toString());
  expect((await valueOf(b.repos.food.watchFood(today))).map((e) => e.name)).toEqual(['Oats']);
  expect((await valueOf(b.repos.customFoods.watchCustomFoods())).map((f) => f.name)).toEqual(['Protein oats']);
  expect((await valueOf(b.repos.preferences.watchNutritionGoals())).waterGoalMl).toBe(2500);
});

it('what this phone holds is described before a restore replaces it', async () => {
  const a = await phone();
  expect(await a.repos.restorer.describeHere()).toMatchObject({ weighIns: 0, foodDays: 0, hasSetup: false });
  await a.repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  await a.repos.weights.saveWeight(today, 82);
  expect(await a.repos.restorer.describeHere()).toMatchObject({ weighIns: 1, hasSetup: true });
});
