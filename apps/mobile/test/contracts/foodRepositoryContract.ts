import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import type { Portion } from '../../src/domain/food/portion/Portion';
import type { ReferenceNutrition } from '../../src/domain/food/portion/ReferenceNutrition';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { FoodRepository } from '../../src/domain/repositories/FoodRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

const entry = (date: CalendarDate, name: string, { kcal = 100 }: { kcal?: number } = {}) =>
  new FoodEntry({ id: 0, date, meal: 'lunch', name, kcal, proteinG: 10, carbsG: 10, fatG: 2, source: 'weighed' });

function found<K, V>(map: ReadonlyMap<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Nothing was read back for ${String(key)}.`);
  return value;
}

/** What every `FoodRepository` must do. */
export function foodRepositoryContract(name: string, create: () => FoodRepository | Promise<FoodRepository>): void {
  describe(`${name} as a FoodRepository`, () => {
    let repo: FoodRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 2);
    beforeEach(async () => {
      repo = await create();
    });

    it('a day with nothing logged is empty', async () => {
      expect(await first(repo.watchFood(d1))).toEqual([]);
    });

    it('add returns increasing ids and keeps the fields', async () => {
      const a = await repo.addFood(entry(d1, 'Oats', { kcal: 300 }));
      const b = await repo.addFood(entry(d1, 'Eggs'));
      expect(b).toBeGreaterThan(a);
      const list = await first(repo.watchFood(d1));
      expect(list.map((e) => e.id)).toEqual([a, b]);
      expect(list[0]?.name).toBe('Oats');
      expect(list[0]?.kcal).toBe(300);
      expect(list[0]?.meal).toBe('lunch');
      expect(list[0]?.source).toBe('weighed');
    });

    it('a day shows only its own entries, in the order added', async () => {
      await repo.addFood(entry(d1, 'First'));
      await repo.addFood(entry(d2, 'Other day'));
      await repo.addFood(entry(d1, 'Second'));
      expect((await first(repo.watchFood(d1))).map((e) => e.name)).toEqual(['First', 'Second']);
    });

    it('delete removes an entry; a missing id does nothing', async () => {
      const id = await repo.addFood(entry(d1, 'Oats'));
      await repo.deleteFood(id + 100);
      expect((await first(repo.watchFood(d1))).length).toBe(1);
      await repo.deleteFood(id);
      expect(await first(repo.watchFood(d1))).toEqual([]);
    });

    it('update changes an entry in place; a missing id does nothing', async () => {
      const a = await repo.addFood(entry(d1, 'Oats', { kcal: 300 }));
      const b = await repo.addFood(entry(d1, 'Eggs'));
      await repo.updateFood(
        new FoodEntry({
          id: a,
          date: d2,
          meal: 'dinner',
          name: 'Porridge',
          kcal: 250,
          proteinG: 9,
          carbsG: 40,
          fatG: 5,
          source: 'householdMeasure',
        }),
      );
      await repo.updateFood(
        new FoodEntry({
          id: b + 100,
          date: d1,
          meal: 'lunch',
          name: 'Ghost',
          kcal: 1,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
          source: 'weighed',
        }),
      );
      const moved = single(await first(repo.watchFood(d2)));
      expect(moved.id).toBe(a);
      expect(moved.name).toBe('Porridge');
      expect(moved.meal).toBe('dinner');
      expect(moved.kcal).toBe(250);
      expect(moved.proteinG).toBe(9);
      expect(moved.source).toBe('householdMeasure');
      expect((await first(repo.watchFood(d1))).map((e) => e.name)).toEqual(['Eggs']);
    });

    it('a portion is stored and read back; an entry without one has none', async () => {
      const reference: ReferenceNutrition = {
        basis: 'perServing',
        nutrition: new NutritionTotals({ kcal: 160, proteinG: 10, carbsG: 15, fatG: 6 }),
        servingDescription: '1 bar',
        servingGrams: 40,
        servingMilliliters: 55,
        servingUnit: 'serving',
        densityGPerMl: 0.73,
      };
      const origin = { packId: 'usda', foodId: 7, source: 'usda_branded', sourceId: '123456' };
      const calculated = await repo.addFood(
        new FoodEntry({
          id: 0,
          date: d1,
          meal: 'snack',
          name: 'Bar',
          kcal: 240,
          proteinG: 15,
          carbsG: 22.5,
          fatG: 9,
          source: 'labelServing',
          portion: {
            method: 'labelServing',
            basis: 'calculated',
            quantity: 1.5,
            unit: 'serving',
            reference,
            origin,
          },
        }),
      );
      const byPalm = await repo.addFood(
        new FoodEntry({
          id: 0,
          date: d1,
          meal: 'dinner',
          name: 'Chicken',
          kcal: 250,
          proteinG: 47,
          carbsG: 0,
          fatG: 5,
          source: 'palm',
          portion: {
            method: 'palm',
            basis: 'calculated',
            quantity: 1.5,
            unit: 'palm',
            reference,
            impliedGrams: 150,
            handModelVersion: 1,
          },
        }),
      );
      const typed = await repo.addFood(
        new FoodEntry({
          id: 0,
          date: d1,
          meal: 'dinner',
          name: 'Stew',
          kcal: 400,
          proteinG: 30,
          carbsG: 40,
          fatG: 10,
          source: 'householdMeasure',
          portion: { method: 'householdMeasure', basis: 'enteredTotals', quantity: 2, unit: 'cup' },
        }),
      );
      await repo.addFood(entry(d1, 'Old style'));

      const all = await first(repo.watchFood(d1));
      const byId = new Map(all.map((e) => [e.id, e]));
      const portionOf = (id: number): Portion => {
        const portion = found(byId, id).portion;
        if (portion === undefined) throw new Error(`Entry ${id} has no portion.`);
        return portion;
      };

      const c = portionOf(calculated);
      expect(c.basis).toBe('calculated');
      expect(c.quantity).toBe(1.5);
      expect(c.unit).toBe('serving');
      expect(c.method).toBe('labelServing');
      expect(c.reference?.basis).toBe('perServing');
      expect(c.reference?.nutrition.kcal).toBe(160);
      expect(c.reference?.servingDescription).toBe('1 bar');
      expect(c.reference?.servingGrams).toBe(40);
      expect(c.reference?.servingMilliliters).toBe(55);
      expect(c.reference?.servingUnit).toBe('serving');
      expect(c.reference?.densityGPerMl).toBe(0.73);
      expect(c.origin).toEqual(origin);
      expect(portionOf(typed).origin).toBeUndefined();
      expect(portionOf(byPalm).impliedGrams).toBe(150);
      expect(portionOf(byPalm).handModelVersion).toBe(1);
      expect(c.impliedGrams).toBeUndefined();
      expect(found(byId, calculated).kcal, 'totals stay as logged').toBe(240);

      const t = portionOf(typed);
      expect(t.basis).toBe('enteredTotals');
      expect(t.quantity).toBe(2);
      expect(t.unit).toBe('cup');
      expect(t.reference).toBeUndefined();
      expect(found(byId, typed).kcal, 'typed totals are not scaled').toBe(400);
      expect(single(all.filter((e) => e.name === 'Old style')).portion).toBeUndefined();
    });

    it('nutrients beyond the macros are kept, and unknown stays unknown', async () => {
      const id = await repo.addFood(
        new FoodEntry({
          id: 0,
          date: d1,
          meal: 'dinner',
          name: 'Lentils',
          kcal: 230,
          proteinG: 18,
          carbsG: 40,
          fatG: 1,
          source: 'weighed',
          fiberG: 16,
          sugarAlcoholsG: 3,
          sodiumMg: 4,
        }),
      );
      await repo.addFood(entry(d1, 'Plain'));
      const byName = new Map((await first(repo.watchFood(d1))).map((e) => [e.name, e]));
      const lentils = found(byName, 'Lentils');
      expect(lentils.id).toBe(id);
      expect(lentils.fiberG).toBe(16);
      expect(lentils.sodiumMg).toBe(4);
      expect(lentils.alcoholG).toBeUndefined();
      // MM-397: sugar alcohols are kept, and net carbs take them with fiber (MM-396).
      expect(lentils.sugarAlcoholsG).toBe(3);
      expect(lentils.netCarbsG).toBe(21);
      const plain = found(byName, 'Plain');
      expect(plain.fiberG).toBeUndefined();
      expect(plain.sugarAlcoholsG).toBeUndefined();
      // What is not stated is not subtracted.
      expect(plain.netCarbsG).toBe(plain.carbsG);
    });

    // MM-308: every micronutrient given is kept, and the rest stay unknown.
    it('micronutrients are kept, sodium among them, and unknown stays unknown', async () => {
      await repo.addFood(
        new FoodEntry({
          id: 0,
          date: d1,
          meal: 'lunch',
          name: 'Banana',
          kcal: 105,
          proteinG: 1.3,
          carbsG: 27,
          fatG: 0.4,
          source: 'weighed',
          sodiumMg: 1,
          micros: new Micronutrients({ potassium: 422, vitaminC: 10.3, folate: 24, sugars: 14.4 }),
        }),
      );
      const [banana] = await first(repo.watchFood(d1));
      expect(banana?.micros.of('potassium')).toBe(422);
      expect(banana?.micros.of('vitaminC')).toBe(10.3);
      expect(banana?.micros.of('folate')).toBe(24);
      expect(banana?.micros.of('sugars')).toBe(14.4);
      expect(banana?.micros.of('sodium')).toBe(1);
      expect(banana?.micros.of('calcium')).toBeUndefined();
      expect(banana?.micros.of('cholesterol')).toBeUndefined();
    });

    it('an update can change or clear the portion', async () => {
      const id = await repo.addFood(
        new FoodEntry({
          id: 0,
          date: d1,
          meal: 'lunch',
          name: 'Oats',
          kcal: 300,
          proteinG: 10,
          carbsG: 50,
          fatG: 5,
          source: 'weighed',
          portion: { method: 'weighed', basis: 'enteredTotals', quantity: 80, unit: 'gram' },
        }),
      );
      await repo.updateFood(
        new FoodEntry({
          id,
          date: d1,
          meal: 'lunch',
          name: 'Oats',
          kcal: 300,
          proteinG: 10,
          carbsG: 50,
          fatG: 5,
          source: 'quickAdd',
        }),
      );
      expect(single(await first(repo.watchFood(d1))).portion).toBeUndefined();
    });

    // MM-167, MM-151: the state the food was logged in and the conversion to grams ride with the portion.
    it('the preparation and the conversion are kept with a portion, and absent stay absent', async () => {
      const reference: ReferenceNutrition = {
        basis: 'per100g',
        nutrition: new NutritionTotals({ kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }),
        servingDescription: '1 cup',
        servingGrams: 158,
        servingUnit: 'serving',
      };
      const cup = await repo.addFood(
        new FoodEntry({
          id: 0,
          date: d1,
          meal: 'dinner',
          name: 'White rice, cooked',
          kcal: 205.4,
          proteinG: 4.3,
          carbsG: 44.2,
          fatG: 0.5,
          source: 'householdMeasure',
          portion: {
            method: 'householdMeasure',
            basis: 'calculated',
            quantity: 1,
            unit: 'serving',
            reference,
            origin: { packId: 'fixture', foodId: 4, source: 'fixture' },
            preparation: 'cooked',
            conversion: { kind: 'servingWeight', gramsPerUnit: 158 },
          },
        }),
      );
      const weighed = await repo.addFood(
        new FoodEntry({
          id: 0,
          date: d1,
          meal: 'dinner',
          name: 'White rice, raw',
          kcal: 730,
          proteinG: 14,
          carbsG: 160,
          fatG: 1.4,
          source: 'weighed',
          portion: { method: 'weighed', basis: 'calculated', quantity: 200, unit: 'gram', reference, preparation: 'raw' },
        }),
      );
      const byId = new Map((await first(repo.watchFood(d1))).map((e) => [e.id, e]));
      expect(found(byId, cup).portion?.preparation).toBe('cooked');
      expect(found(byId, cup).portion?.conversion).toEqual({ kind: 'servingWeight', gramsPerUnit: 158 });
      expect(found(byId, weighed).portion?.preparation).toBe('raw');
      expect(found(byId, weighed).portion?.conversion, 'a weight needs none').toBeUndefined();
    });

    // MM-151: which state a food was last logged in is read back from the whole log, not only recent foods.
    it('the last entry logged from a food is found however long ago, and none for a food never logged', async () => {
      const from = (name: string, foodId: number, unit: 'gram' | 'serving') =>
        new FoodEntry({
          id: 0,
          date: d1,
          meal: 'lunch',
          name,
          kcal: 100,
          proteinG: 1,
          carbsG: 1,
          fatG: 1,
          source: unit === 'gram' ? 'weighed' : 'householdMeasure',
          portion: {
            method: unit === 'gram' ? 'weighed' : 'householdMeasure',
            basis: 'calculated',
            quantity: 1,
            unit,
            origin: { packId: 'fixture', foodId, source: 'fixture' },
          },
        });
      expect(await repo.lastLoggedFrom('fixture', [3, 4])).toBeUndefined();
      await repo.addFood(from('White rice, raw', 3, 'gram'));
      for (let i = 0; i < 30; i++) await repo.addFood(entry(d2, `Other food ${i}`));
      expect((await repo.lastLoggedFrom('fixture', [3, 4]))?.name).toBe('White rice, raw');
      await repo.addFood(from('White rice, cooked', 4, 'serving'));
      const last = await repo.lastLoggedFrom('fixture', [3, 4]);
      expect(last?.name).toBe('White rice, cooked');
      expect(last?.portion?.unit).toBe('serving');
      expect(await repo.lastLoggedFrom('other-pack', [3, 4]), 'another pack\'s ids are another food').toBeUndefined();
      expect(await repo.lastLoggedFrom('fixture', [])).toBeUndefined();
    });

    it('how often and when last each saved food was logged, by its id (MM-706)', async () => {
      const from = (date: CalendarDate, name: string, packId: string, foodId: number) =>
        new FoodEntry({
          id: 0,
          date,
          meal: 'lunch',
          name,
          kcal: 100,
          proteinG: 1,
          carbsG: 1,
          fatG: 1,
          source: 'weighed',
          portion: { method: 'weighed', basis: 'calculated', quantity: 1, unit: 'gram', origin: { packId, foodId, source: packId === 'custom' ? 'user' : 'fixture' } },
        });
      expect((await first(repo.watchSavedFoodUsage())).size).toBe(0);
      await repo.addFood(from(d2, 'Protein bar', 'custom', 7));
      await repo.addFood(from(d1, 'Protein bar', 'custom', 7));
      await repo.addFood(from(d1, 'Overnight oats', 'custom', 9));
      await repo.addFood(from(d2, 'White rice, raw', 'fixture', 7));
      await repo.addFood(entry(d2, 'Typed food'));
      const usage = await first(repo.watchSavedFoodUsage());
      expect([...usage.keys()].sort()).toEqual([7, 9]);
      expect(usage.get(7)?.times).toBe(2);
      expect(usage.get(7)?.lastDay.epochDay, 'the latest day, not the latest entry').toBe(d2.epochDay);
      expect(usage.get(9)?.times).toBe(1);
      expect(usage.get(9)?.lastDay.epochDay).toBe(d1.epochDay);
      await expectChangeEmits(repo.watchSavedFoodUsage(), {
        see: (all) => all.get(9)?.times,
        before: 1,
        change: () => repo.addFood(from(d2, 'Overnight oats', 'custom', 9)),
        after: 2,
      });
    });

    it('ids are never reused after a delete', async () => {
      const a = await repo.addFood(entry(d1, 'Oats'));
      await repo.deleteFood(a);
      const b = await repo.addFood(entry(d1, 'Eggs'));
      expect(b).toBeGreaterThan(a);
    });

    it('recent foods are distinct by name, newest first, and limited', async () => {
      await repo.addFood(entry(d1, 'Oats'));
      await repo.addFood(entry(d1, 'Eggs'));
      await repo.addFood(entry(d2, 'oats', { kcal: 250 }));
      const recent = await first(repo.watchRecentFoods());
      expect(recent.map((e) => e.name.toLowerCase())).toEqual(['oats', 'eggs']);
      expect(recent[0]?.kcal).toBe(250);
      expect((await first(repo.watchRecentFoods({ limit: 1 }))).length).toBe(1);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchFood(d1), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.addFood(entry(d1, 'Oats')),
        after: 1,
      });
    });

    it('MM-625: a batch adds, updates and deletes in one step, and gives the new ids in order', async () => {
      const keep = await repo.addFood(entry(d1, 'Oats'));
      const gone = await repo.addFood(entry(d1, 'Toast'));
      const [oatsBefore] = await first(repo.watchFood(d1));
      const ids = await repo.applyFoodChanges({
        add: [entry(d1, 'Eggs'), entry(d2, 'Rice')],
        update: [(oatsBefore as FoodEntry).copyWith({ name: 'Porridge', meal: 'breakfast' })],
        delete: [gone],
      });
      expect(ids).toHaveLength(2);
      expect(ids[0]).toBeGreaterThan(gone);
      expect(ids[1]).toBeGreaterThan(ids[0] as number);
      expect((await first(repo.watchFood(d1))).map((e) => [e.id, e.name, e.meal])).toEqual([
        [keep, 'Porridge', 'breakfast'],
        [ids[0], 'Eggs', 'lunch'],
      ]);
      expect((await first(repo.watchFood(d2))).map((e) => e.name)).toEqual(['Rice']);
      expect(await repo.applyFoodChanges({})).toEqual([]);
    });

    it('MM-625: a batch that names a food no longer in the log changes nothing', async () => {
      const id = await repo.addFood(entry(d1, 'Oats'));
      const [oats] = await first(repo.watchFood(d1));
      await expect(
        repo.applyFoodChanges({ add: [entry(d1, 'Eggs')], update: [(oats as FoodEntry).copyWith({ name: 'Porridge' })], delete: [id + 100] }),
      ).rejects.toThrow();
      await expect(repo.applyFoodChanges({ update: [(oats as FoodEntry).copyWith({ id: id + 100 })] })).rejects.toThrow();
      expect((await first(repo.watchFood(d1))).map((e) => e.name)).toEqual(['Oats']);
    });

    it('MM-625: a watcher sees a batch whole, never part of it', async () => {
      const ids = [await repo.addFood(entry(d1, 'A')), await repo.addFood(entry(d1, 'B')), await repo.addFood(entry(d1, 'C'))];
      const seen: number[] = [];
      let arrived: () => void = () => {};
      const firstValue = new Promise<void>((resolve) => {
        arrived = resolve;
      });
      const stop = repo.watchFood(d1).subscribe((list) => {
        seen.push(list.length);
        arrived();
      });
      await firstValue;
      await repo.applyFoodChanges({ delete: ids });
      for (let i = 0; i < 100 && seen[seen.length - 1] !== 0; i++) await new Promise((resolve) => setTimeout(resolve, 0));
      stop();
      expect(seen[0]).toBe(3);
      expect(seen[seen.length - 1]).toBe(0);
      expect(seen.filter((n) => n === 1 || n === 2)).toEqual([]);
    });

    it('MM-570: the time eaten is kept, changed by an update, and unknown stays unknown', async () => {
      const timed = (id: number, eatenAt: number | undefined) =>
        new FoodEntry({ id, date: d1, meal: 'lunch', name: 'Soup', kcal: 300, proteinG: 10, carbsG: 30, fatG: 8, source: 'weighed', eatenAt });
      const a = await repo.addFood(timed(0, 12 * 60 + 7));
      await repo.addFood(entry(d1, 'Untimed'));
      const midnight = await repo.addFood(timed(0, 0));
      const lastMinute = await repo.addFood(timed(0, 1439));
      const read = async () => new Map((await first(repo.watchFood(d1))).map((e) => [e.id, e.eatenAt] as const));
      expect([...(await read()).values()]).toEqual([12 * 60 + 7, undefined, 0, 1439]);
      await repo.updateFood(timed(a, 19 * 60 + 45));
      expect(found(await read(), a)).toBe(19 * 60 + 45);
      expect(found(await read(), midnight)).toBe(0);
      expect(found(await read(), lastMinute)).toBe(1439);
      // Read through the other reads too: the recent foods and a run of days.
      expect((await first(repo.watchRecentFoods())).find((e) => e.name === 'Soup')?.eatenAt).toBeDefined();
      expect((await first(repo.watchFoodBetween(d1, d1))).map((e) => e.eatenAt)).toEqual([19 * 60 + 45, undefined, 0, 1439]);
    });

    it('MM-570: a run of days holds every entry from its first day to its last, both included, by day then as added', async () => {
      const d0 = CalendarDate.of(2025, 12, 31);
      const d3 = CalendarDate.of(2026, 1, 3);
      await repo.addFood(entry(d2, 'Second day, first'));
      await repo.addFood(entry(d0, 'Before'));
      await repo.addFood(entry(d1, 'First day'));
      await repo.addFood(entry(d3, 'After'));
      await repo.addFood(entry(d2, 'Second day, second'));
      expect((await first(repo.watchFoodBetween(d1, d2))).map((e) => e.name)).toEqual([
        'First day',
        'Second day, first',
        'Second day, second',
      ]);
      expect((await first(repo.watchFoodBetween(d0, d0))).map((e) => e.name)).toEqual(['Before']);
      expect((await first(repo.watchFoodBetween(d0, d3))).map((e) => e.date)).toEqual([d0, d1, d2, d2, d3]);
    });

    it('MM-570: a run of days with nothing in it, or that ends before it starts, is empty', async () => {
      await repo.addFood(entry(d1, 'Oats'));
      expect(await first(repo.watchFoodBetween(CalendarDate.of(2026, 2, 1), CalendarDate.of(2026, 2, 28)))).toEqual([]);
      expect(await first(repo.watchFoodBetween(d2, d1))).toEqual([]);
    });

    it('MM-570: a run of days gives its current entries first, then again when one is added inside it', async () => {
      await repo.addFood(entry(d1, 'Oats'));
      await expectChangeEmits(repo.watchFoodBetween(d1, d2), {
        see: (l) => l.map((e) => e.name),
        before: ['Oats'],
        change: () => repo.addFood(entry(d2, 'Eggs')),
        after: ['Oats', 'Eggs'],
      });
    });

    const ofMeal = (date: CalendarDate, name: string, key: string, mealName: string) =>
      entry(date, name).copyWith({
        source: 'photoEstimate',
        loggedMeal: { key, name: mealName },
        evidence: { kind: 'cited', citation: `USDA FDC ${name}` },
      });

    it('MM-586, MM-587: a food of a meal keeps its meal and where its numbers came from; an update changes them', async () => {
      const a = await repo.addFood(ofMeal(d1, 'Rice', 'k1', 'Taco night'));
      await repo.addFood(entry(d1, 'Oats'));
      const read = async () => new Map((await first(repo.watchFood(d1))).map((e) => [e.name, e] as const));
      expect(found(await read(), 'Rice').loggedMeal).toEqual({ key: 'k1', name: 'Taco night' });
      expect(found(await read(), 'Rice').evidence).toEqual({ kind: 'cited', citation: 'USDA FDC Rice' });
      expect(found(await read(), 'Rice').source).toBe('photoEstimate');
      expect(found(await read(), 'Oats').loggedMeal, 'a food on its own is in no meal').toBeUndefined();
      expect(found(await read(), 'Oats').evidence).toBeUndefined();
      const rice = found(await read(), 'Rice');
      await repo.updateFood(rice.copyWith({ id: a, loggedMeal: { key: 'k1', name: 'Tacos' }, evidence: { kind: 'yours' } }));
      expect(found(await read(), 'Rice').loggedMeal?.name).toBe('Tacos');
      expect(found(await read(), 'Rice').evidence).toEqual({ kind: 'yours', citation: undefined });
    });

    it('MM-587: recent foods leave out the foods of a meal, and recent meals give each meal once, as last logged', async () => {
      await repo.addFood(ofMeal(d1, 'Rice', 'k1', 'Taco night'));
      await repo.addFood(ofMeal(d1, 'Beans', 'k1', 'Taco night'));
      await repo.addFood(entry(d1, 'Oats'));
      await repo.addFood(ofMeal(d2, 'Rice', 'k2', 'taco night'));
      await repo.addFood(ofMeal(d2, 'Salsa', 'k2', 'taco night'));
      await repo.addFood(ofMeal(d2, 'Toast', 'k3', 'Breakfast plate'));
      expect((await first(repo.watchRecentFoods())).map((e) => e.name)).toEqual(['Oats']);
      const meals = await first(repo.watchRecentMeals());
      expect(meals.map((m) => [m.key, m.name, m.items.map((i) => i.name)])).toEqual([
        ['k3', 'Breakfast plate', ['Toast']],
        ['k2', 'taco night', ['Rice', 'Salsa']],
      ]);
      expect(meals[1]?.date).toEqual(d2);
      expect((await first(repo.watchRecentMeals({ limit: 1 }))).map((m) => m.key)).toEqual(['k3']);
    });

    it('MM-596: every food ever logged is found by any part of its name, ignoring case, once, as last logged', async () => {
      await repo.addFood(entry(d1, 'Tonkatsu sauce', { kcal: 38 }));
      for (let i = 0; i < 30; i++) await repo.addFood(entry(d1, `Filler ${i}`));
      await repo.addFood(ofMeal(d2, 'Japanese mayonnaise', 'k1', 'Katsu plate'));
      await repo.addFood(entry(d2, 'tonkatsu SAUCE', { kcal: 40 }));
      const found = await repo.searchLoggedFoods('katsu');
      expect(found.map((e) => e.name)).toEqual(['tonkatsu SAUCE']);
      expect(found[0]?.kcal, 'as last logged').toBe(40);
      expect((await repo.searchLoggedFoods('mayo')).map((e) => e.name), 'a food of a meal too').toEqual(['Japanese mayonnaise']);
      expect((await repo.searchLoggedFoods('FILLER', { limit: 3 })).map((e) => e.name)).toEqual(['Filler 29', 'Filler 28', 'Filler 27']);
      expect(await repo.searchLoggedFoods('nothing like it')).toEqual([]);
    });

    it('MM-596: a % or _ in what is searched for is taken as itself', async () => {
      await repo.addFood(entry(d1, 'Milk 2% fat'));
      await repo.addFood(entry(d1, 'Milk 20 fat'));
      expect((await repo.searchLoggedFoods('2%')).map((e) => e.name)).toEqual(['Milk 2% fat']);
      expect(await repo.searchLoggedFoods('k_2')).toEqual([]);
    });

    it('MM-596: every meal ever logged is found by its name, once, as last logged', async () => {
      await repo.addFood(ofMeal(d1, 'Rice', 'k1', 'Katsu plate'));
      await repo.addFood(ofMeal(d1, 'Cabbage', 'k1', 'Katsu plate'));
      await repo.addFood(ofMeal(d2, 'Rice', 'k2', 'katsu PLATE'));
      await repo.addFood(ofMeal(d2, 'Toast', 'k3', 'Breakfast'));
      const meals = await repo.searchLoggedMeals('katsu');
      expect(meals.map((m) => [m.key, m.items.map((i) => i.name)])).toEqual([['k2', ['Rice']]]);
      expect(await repo.searchLoggedMeals('lunch')).toEqual([]);
    });
  });
}
