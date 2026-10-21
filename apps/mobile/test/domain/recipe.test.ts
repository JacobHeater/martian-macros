import { expect, it } from 'vitest';
import { NutritionTotals, type RecipeIngredient, recipePerServing, recipeServingGrams, reweighedIngredient } from '../../src/domain';
import { expectClose } from '../support/expectClose';

/** MM-45: a recipe's serving is a share of the summed ingredients. */
const item = (name: string, kcal: number, grams?: number): RecipeIngredient => ({
  name,
  grams,
  totals: new NutritionTotals({ kcal, proteinG: kcal / 20, carbsG: kcal / 10, fatG: kcal / 40 }),
});

it('one serving of a four-serving recipe is a quarter of the sum', () => {
  const ingredients = [item('Chicken', 825, 500), item('Rice', 1040, 300), item('Oil', 177, 20)];
  const one = recipePerServing(ingredients, 4);
  expectClose(one?.kcal, (825 + 1040 + 177) / 4, 1e-9);
  expectClose(one?.proteinG, (825 + 1040 + 177) / 20 / 4, 1e-9);
});

it('servings must be above zero', () => {
  expect(recipePerServing([item('x', 100)], 0)).toBeUndefined();
  expect(recipePerServing([item('x', 100)], -1)).toBeUndefined();
  expect(recipePerServing([item('x', 100)], Number.NaN)).toBeUndefined();
});

it('a serving weighs the cooked weight over the servings, never raw', () => {
  expect(recipeServingGrams(1200, 4)).toBe(300);
  expect(recipeServingGrams(undefined, 4)).toBeUndefined();
  expect(recipeServingGrams(0, 4)).toBeUndefined();
});

// MM-456: a found line's weight changed in place is worked out again from its food per 100 g.
it('a line weighed again takes its totals from the food per 100 g, and keeps its name and source', () => {
  const rawRice = new NutritionTotals({ kcal: 365, proteinG: 7, carbsG: 80, fatG: 0.7 });
  const line: RecipeIngredient = {
    name: 'White rice, raw',
    grams: 200,
    totals: rawRice.times(2),
    source: { packId: 'fixture', foodId: 3 },
  };
  const lighter = reweighedIngredient(line, rawRice, 100);
  expectClose(lighter?.totals.kcal, 365, 1e-9);
  expectClose(lighter?.totals.carbsG, 80, 1e-9);
  expect(lighter?.grams).toBe(100);
  expect(lighter?.name).toBe('White rice, raw');
  expect(lighter?.source).toEqual({ packId: 'fixture', foodId: 3 });
  expect(reweighedIngredient(line, rawRice, 0)).toBeUndefined();
  expect(reweighedIngredient(line, rawRice, Number.NaN)).toBeUndefined();
});
