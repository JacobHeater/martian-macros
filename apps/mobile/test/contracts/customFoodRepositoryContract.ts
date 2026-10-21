import { beforeEach, describe, expect, it } from 'vitest';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import type { CustomFoodRepository } from '../../src/domain/repositories/CustomFoodRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

const food = (
  name: string,
  { id = 0, kcal = 120, barcode }: { id?: number; kcal?: number; barcode?: string | undefined } = {},
) =>
  new CustomFood({
    id,
    name,
    kind: 'food',
    servingDescription: '1 bar',
    servingGrams: 30,
    perServing: new NutritionTotals({ kcal, proteinG: 10, carbsG: 12, fatG: 4 }),
    barcode,
  });

/** What every `CustomFoodRepository` must do (MM-45). */
export function customFoodRepositoryContract(
  name: string,
  create: () => CustomFoodRepository | Promise<CustomFoodRepository>,
): void {
  describe(`${name} as a CustomFoodRepository`, () => {
    let repo: CustomFoodRepository;
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchCustomFoods())).toEqual([]);
    });

    it('a saved food is read back with its fields, by name', async () => {
      const b = await repo.saveCustomFood(food('Bar', { barcode: '00012345678905' }));
      const a = await repo.saveCustomFood(food('Apple'));
      expect(b).toBeGreaterThan(0);
      expect(a).toBeGreaterThan(b);
      const list = await first(repo.watchCustomFoods());
      expect(list.map((f) => f.name)).toEqual(['Apple', 'Bar']);
      const bar = list[1] as CustomFood;
      expect(bar.id).toBe(b);
      expect(bar.kind).toBe('food');
      expect(bar.servingDescription).toBe('1 bar');
      expect(bar.servingGrams).toBe(30);
      expect(bar.perServing.kcal).toBe(120);
      expect(bar.perServing.proteinG).toBe(10);
      expect(bar.barcode).toBe('00012345678905');
    });

    // MM-309: fiber, sodium and the micronutrients per serving are kept; unknown stays unknown.
    it('a food keeps fiber, sodium and its micronutrients', async () => {
      await repo.saveCustomFood(
        new CustomFood({
          id: 0,
          name: 'Oat milk',
          kind: 'food',
          servingDescription: '1 cup',
          servingGrams: 240,
          perServing: new NutritionTotals({ kcal: 120, proteinG: 3, carbsG: 16, fatG: 5 }),
          fiberG: 2,
          micros: new Micronutrients({ sodium: 160, calcium: 260, vitaminD: 2 }),
        }),
      );
      const food = single(await first(repo.watchCustomFoods()));
      expect(food.fiberG).toBe(2);
      expect(food.micros.of('sodium')).toBe(160);
      expect(food.micros.of('calcium')).toBe(260);
      expect(food.micros.of('vitaminD')).toBe(2);
      expect(food.micros.of('iron')).toBeUndefined();
    });

    it('saving with an id replaces that food', async () => {
      const id = await repo.saveCustomFood(food('Bar'));
      await repo.saveCustomFood(food('Bar', { id, kcal: 150 }));
      expect(single(await first(repo.watchCustomFoods())).perServing.kcal).toBe(150);
    });

    it('a recipe keeps its ingredients in order', async () => {
      const id = await repo.saveCustomFood(
        new CustomFood({
          id: 0,
          name: 'Chili',
          kind: 'recipe',
          servingDescription: '1 bowl',
          servingGrams: 300,
          perServing: new NutritionTotals({ kcal: 500, proteinG: 40, carbsG: 50, fatG: 15 }),
          servings: 4,
          cookedWeightGrams: 1200,
          ingredients: [
            {
              name: 'Beef',
              grams: 500,
              totals: new NutritionTotals({ kcal: 1250, proteinG: 100, carbsG: 0, fatG: 90 }),
            },
            { name: 'Beans', totals: new NutritionTotals({ kcal: 750, proteinG: 50, carbsG: 130, fatG: 5 }) },
          ],
        }),
      );
      const chili = single(await first(repo.watchCustomFoods()));
      expect(chili.id).toBe(id);
      expect(chili.kind).toBe('recipe');
      expect(chili.servings).toBe(4);
      expect(chili.cookedWeightGrams).toBe(1200);
      expect(chili.ingredients.map((i) => i.name)).toEqual(['Beef', 'Beans']);
      expect(chili.ingredients[0]?.grams).toBe(500);
      expect(chili.ingredients[1]?.grams).toBeUndefined();
      expect(chili.ingredients[0]?.totals.kcal).toBe(1250);

      // Replacing it replaces its ingredients, not adds to them.
      await repo.saveCustomFood(
        new CustomFood({
          id,
          name: 'Chili',
          kind: 'recipe',
          servingDescription: '1 bowl',
          perServing: chili.perServing,
          servings: 4,
          ingredients: chili.ingredients.slice(0, 1),
        }),
      );
      const again = single(await first(repo.watchCustomFoods()));
      expect(again.ingredients.length).toBe(1);
      expect(again.servingGrams).toBeUndefined();
    });

    // MM-456: a line found in a pack keeps the pack food it came from; a typed line has none.
    it("a recipe's found line keeps its pack food, and a typed line has none", async () => {
      await repo.saveCustomFood(
        new CustomFood({
          id: 0,
          name: 'Rice bowl',
          kind: 'recipe',
          servingDescription: '1 serving',
          perServing: new NutritionTotals({ kcal: 400, proteinG: 8, carbsG: 80, fatG: 2 }),
          servings: 2,
          ingredients: [
            {
              name: 'White rice, raw',
              grams: 200,
              totals: new NutritionTotals({ kcal: 730, proteinG: 14, carbsG: 160, fatG: 1.4 }),
              source: { packId: 'fixture', foodId: 3 },
            },
            { name: 'Butter', totals: new NutritionTotals({ kcal: 70, proteinG: 0, carbsG: 0, fatG: 8 }) },
          ],
        }),
      );
      const bowl = single(await first(repo.watchCustomFoods()));
      expect(bowl.ingredients[0]?.source).toEqual({ packId: 'fixture', foodId: 3 });
      expect(bowl.ingredients[1]?.source).toBeUndefined();
    });

    it('delete removes a food; a missing id does nothing', async () => {
      const id = await repo.saveCustomFood(food('Bar'));
      await repo.deleteCustomFood(id + 100);
      expect((await first(repo.watchCustomFoods())).length).toBe(1);
      await repo.deleteCustomFood(id);
      expect(await first(repo.watchCustomFoods())).toEqual([]);
    });

    it('ids are never reused after a delete', async () => {
      const a = await repo.saveCustomFood(food('Bar'));
      await repo.deleteCustomFood(a);
      const b = await repo.saveCustomFood(food('Bar'));
      expect(b).toBeGreaterThan(a);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchCustomFoods(), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.saveCustomFood(food('Bar')),
        after: 1,
      });
    });
  });
}
