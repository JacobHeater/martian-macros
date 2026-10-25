import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CarbFatBalance } from '../../src/domain/CarbFatBalance';
import { MeasurementSettings } from '../../src/domain/measurements/MeasurementSettings';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { TargetShape } from '../../src/domain/TargetShape';
import { WeekShape } from '../../src/domain/WeekShape';
import { WeighInWindow } from '../../src/healthIngest/WeighInWindow';
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
  // MM-441: the weigh-in window goes with the backup.
  await a.repos.weighInWindow.saveWeighInWindow(new WeighInWindow({ startMinute: 14 * 60 + 30, endMinute: 24 * 60 }));
  // MM-486: the shapes go with the backup.
  await a.repos.targetShapes.saveTargetShape(
    new TargetShape({ since: today.addDays(-21), balance: new CarbFatBalance({ fatShare: CarbFatBalance.moreFatFatShare }) }),
  );
  await a.repos.targetShapes.saveTargetShape(
    new TargetShape({
      since: today,
      balance: new CarbFatBalance({ fatShare: CarbFatBalance.moreFatFatShare }),
      week: new WeekShape({ higherDays: [6, 0], raise: 0.2 }),
    }),
  );
  // MM-156: every site's measurements and the sites chosen go with the backup.
  await a.repos.measurements.saveMeasurement('thigh', today.addDays(-2), 58, { readings: [57.5, 58, 58.5] });
  await a.repos.measurementSettings.saveMeasurementSettings(new MeasurementSettings({ sites: ['thigh'], limbSide: 'right', suggestionAnswered: true }));
  // MM-507: the goal body fat goes with the backup.
  await a.repos.goalBodyFat.saveGoalBodyFat({ percent: 18, setOn: today.addDays(-3) });
  // MM-611: the days marked go with the backup.
  await a.repos.dayKinds.setDayKind(today.addDays(-1), 'refeed');
  // MM-605: what the trend engine said, and the findings dismissed, go with the backup.
  const said = {
    key: 'protein:level',
    transition: 'new',
    on: today.addDays(-1),
    direction: 'down',
    onsetDate: today.addDays(-10),
    figures: { effect: -25, unit: 'g', n: 14, k: 11, span: 14, coverage: 0.86 },
    tier: 'clear',
    rulesVersion: 1,
  } as const;
  await a.repos.trendLog.appendTrendAnnouncements([said]);
  await a.repos.trendLog.dismissFinding('protein:level', today);
  // MM-617: the coach's record of the advice it showed goes with the backup.
  const advised = { foodKey: 'biscuit', foodName: 'Biscuit', kind: 'swap', replacementName: 'biscuit', kcal: 691, on: today } as const;
  await a.repos.adviceRecord.recordAdviceGiven([advised]);
  const snapshot = await a.db.exportBytes();

  const b = await phone();
  await b.repos.weights.saveWeight(today.addDays(-10), 90);
  await b.repos.targetShapes.saveTargetShape(new TargetShape({ since: today.addDays(-5), balance: CarbFatBalance.balanced }));
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
  const kept = await valueOf(b.repos.weighInWindow.watchWeighInWindow());
  expect([kept.startMinute, kept.endMinute]).toEqual([14 * 60 + 30, 24 * 60]);
  const shapes = await valueOf(b.repos.targetShapes.watchTargetShapes());
  expect(shapes.map((s) => s.since.toString())).toEqual([today.addDays(-21).toString(), today.toString()]);
  expect(shapes.map((s) => s.balance?.fatShare)).toEqual([CarbFatBalance.moreFatFatShare, CarbFatBalance.moreFatFatShare]);
  expect(shapes.map((s) => [...s.week.higherDays])).toEqual([[], [0, 6]]);
  expect(await valueOf(b.repos.goalBodyFat.watchGoalBodyFat())).toEqual({ percent: 18, setOn: today.addDays(-3) });
  expect(await valueOf(b.repos.dayKinds.watchDayKind(today.addDays(-1)))).toBe('refeed');
  expect(await valueOf(b.repos.trendLog.watchTrendAnnouncements())).toEqual([said]);
  expect(await valueOf(b.repos.trendLog.watchFindingDismissals())).toEqual([{ findingId: 'protein:level', dismissedOn: today }]);
  expect(await valueOf(b.repos.adviceRecord.watchAdviceGivenSince(today.addDays(-14)))).toEqual([advised]);
  expect((await valueOf(b.repos.measurements.watchSite('thigh'))).map((o) => [o.valueCm, [...o.readings]])).toEqual([[58, [57.5, 58, 58.5]]]);
  const sites = await valueOf(b.repos.measurementSettings.watchMeasurementSettings());
  expect([[...sites.sites], sites.limbSide, sites.suggestionAnswered]).toEqual([['thigh'], 'right', true]);
});

it('what this phone holds is described before a restore replaces it', async () => {
  const a = await phone();
  expect(await a.repos.restorer.describeHere()).toMatchObject({ weighIns: 0, foodDays: 0, hasSetup: false });
  await a.repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  await a.repos.weights.saveWeight(today, 82);
  expect(await a.repos.restorer.describeHere()).toMatchObject({ weighIns: 1, hasSetup: true });
});
