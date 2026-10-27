import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { SavedMealRepository } from '../../src/domain/repositories/SavedMealRepository';
import { first } from '../support/first';

const day = CalendarDate.of(2026, 10, 26);

/** Yogurt as logged: a label serving with its reference, extras and a meal it was one of. */
const yogurt = new FoodEntry({
  id: 7,
  date: day,
  meal: 'breakfast',
  name: 'Greek yogurt',
  kcal: 100,
  proteinG: 17,
  carbsG: 6,
  fatG: 0.7,
  source: 'labelServing',
  portion: {
    method: 'labelServing',
    basis: 'calculated',
    quantity: 1,
    unit: 'serving',
    reference: { basis: 'perServing', servingUnit: 'serving', nutrition: new NutritionTotals({ kcal: 100, proteinG: 17, carbsG: 6, fatG: 0.7 }) },
  },
  fiberG: 0,
  sodiumMg: 60,
  micros: new Micronutrients({ calcium: 190 }),
  eatenAt: 8 * 60,
  loggedMeal: { key: 'k1', name: 'Breakfast bowl' },
});
const berries = new FoodEntry({ id: 8, date: day, meal: 'breakfast', name: 'Berries', kcal: 40, proteinG: 1, carbsG: 9, fatG: 0, source: 'weighed' });

/** What every `SavedMealRepository` must do (MM-645). */
export function savedMealRepositoryContract(name: string, create: () => SavedMealRepository | Promise<SavedMealRepository>): void {
  describe(`${name} as a SavedMealRepository`, () => {
    let repo: SavedMealRepository;
    beforeEach(async () => {
      repo = await create();
    });

    it('nothing is saved at first', async () => {
      expect(await first(repo.watchSavedMeals())).toEqual([]);
    });

    it('a meal keeps its name and its foods in order, each with every number, and loose', async () => {
      const id = await repo.saveMeal('Usual breakfast', [yogurt, berries], day);
      const [meal] = await first(repo.watchSavedMeals());
      expect(meal?.id).toBe(id);
      expect(meal?.name).toBe('Usual breakfast');
      expect(meal?.foods.map((f) => f.name)).toEqual(['Greek yogurt', 'Berries']);
      const kept = meal?.foods[0];
      expect(kept?.kcal).toBe(100);
      expect(kept?.sodiumMg).toBe(60);
      expect(kept?.fiberG, 'a known zero stays zero').toBe(0);
      expect(kept?.micros.of('calcium')).toBe(190);
      expect(kept?.portion?.reference?.basis).toBe('perServing');
      expect(kept?.loggedMeal, 'loose').toBeUndefined();
      expect(meal?.foods[1]?.sugarAlcoholsG, 'unknown stays unknown').toBeUndefined();
    });

    it('meals list newest first, and a deleted meal goes with its foods', async () => {
      const a = await repo.saveMeal('A', [berries], day);
      const b = await repo.saveMeal('B', [yogurt], day);
      expect(b).toBeGreaterThan(a);
      expect((await first(repo.watchSavedMeals())).map((m) => m.name)).toEqual(['B', 'A']);
      await repo.deleteSavedMeal(b);
      await repo.deleteSavedMeal(b + 100);
      expect((await first(repo.watchSavedMeals())).map((m) => m.name)).toEqual(['A']);
    });
  });
}
