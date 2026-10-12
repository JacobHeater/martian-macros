import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
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
      expect(lentils.netCarbsG).toBe(24);
      expect(found(byName, 'Plain').fiberG).toBeUndefined();
      expect(found(byName, 'Plain').netCarbsG).toBeUndefined();
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
  });
}
