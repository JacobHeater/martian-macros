import { expect, it } from 'vitest';
import { NutritionTotals, type RecipeIngredient, recipePerServing, recipeServingGrams } from '../../src/domain';
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
