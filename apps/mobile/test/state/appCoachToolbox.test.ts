import { describe, expect, it } from 'vitest';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import type { CatalogSearch } from '../../src/foodCatalog/CatalogSearch';
import type { CatalogServingLookup } from '../../src/foodCatalog/CatalogServingLookup';
import { AppCoachToolbox } from '../../src/state/AppCoachToolbox';
import { catalogFood, catalogOf, day, logged } from '../engine/support/movesFixtures';
import { inputOf } from '../engine/support/foodAnalysis';

/**
 * MM-685: the tools the coach's model may call, answered from the app's own
 * state and engine, every number in an answer one the model may then say.
 */
const breakfast = [logged(day, 'breakfast', 'Buttermilk biscuit', 541, 10, 27), logged(day, 'breakfast', 'Large eggs', 303, 24, 20)];
const earlier = [1, 2].map((ago) => logged(day.addDays(-ago), 'breakfast', 'Greek yogurt', 150, 20, 1));

/** A catalog of one food, chicken breast per 100 g with a 120 g serving. */
const catalog: CatalogSearch & CatalogServingLookup = {
  search: async (query, options) => {
    const food = new CatalogFood({
      id: 1,
      packId: 'fixture',
      name: 'Chicken breast',
      kcal: 165,
      proteinG: 31,
      carbsG: 0,
      fatG: 3.6,
      source: 'fixture',
      tier: 'reference',
      tierReason: 'Test data.',
      group: 'meatAndPoultry',
    });
    if (options?.group !== undefined && options.group !== 'meatAndPoultry') return [];
    return query === '' || /chicken/i.test(query) ? [{ food, score: 0, firstServing: { description: '1 breast', grams: 120 } }] : [];
  },
  servingsOf: async () => [{ description: '1 breast', grams: 120 }],
};

const toolbox = (withCatalog = true) =>
  new AppCoachToolbox({
    foodInput: () => inputOf([{ date: day, entries: breakfast }], { entries: [...breakfast, ...earlier], catalog: catalogOf(catalogFood(1, 'Chicken breast', 'meatAndPoultry', 165, 31, 3.6)) }),
    brief: () => undefined,
    catalog: () => (withCatalog ? catalog : undefined),
  });

describe('the meal’s tools', () => {
  it('say the meal and the day', async () => {
    const box = toolbox().forMeal(day, 'breakfast');
    expect(box.tools.map((t) => t.name)).toEqual(['meal_and_day', 'moves', 'my_foods_at_meal', 'search_catalog', 'price_move']);
    const { result, numbers } = await box.call('meal_and_day', {});
    expect(result).toMatchObject({ meal: 'breakfast', mealKcal: 844, mealProteinG: 34, kcalTarget: 2400, proteinTargetG: 170, kcalLeft: 1556, proteinToGoG: 136 });
    expect((result as { foods: { name: string }[] }).foods.map((f) => f.name)).toEqual(['Buttermilk biscuit', 'Large eggs']);
    expect(numbers).toEqual(expect.arrayContaining([844, 34, 541, 10, 1556, 136]));
  });

  it('give the engine’s moves, the drag first', async () => {
    const { result } = await toolbox().forMeal(day, 'breakfast').call('moves', {});
    expect(result).toMatchObject({ drag: { name: 'Buttermilk biscuit', kcal: 541, proteinG: 10 } });
    const { best } = result as { best: { kind: string } };
    expect(['addProtein', 'cutPortion', 'nextMeal']).toContain(best.kind);
  });

  it('list the person’s foods at the slot, the most logged first', async () => {
    const { result } = await toolbox().forMeal(day, 'breakfast').call('my_foods_at_meal', {});
    expect(result).toMatchObject({ meal: 'breakfast' });
    const { foods } = result as { foods: { name: string; daysLogged: number; kcal: number; proteinG: number }[] };
    expect(foods[0]).toMatchObject({ name: 'Greek yogurt', daysLogged: 2, kcal: 150, proteinG: 20 });
  });

  it('search the catalog at the serving, held to a calorie ceiling and a protein share', async () => {
    const box = toolbox().forMeal(day, 'breakfast');
    const { result, numbers } = await box.call('search_catalog', { query: 'chicken' });
    expect(result).toEqual({ foods: [{ name: 'Chicken breast', group: 'meatAndPoultry', servingGrams: 120, kcal: 198, proteinG: 37, carbsG: 0, fatG: 4 }] });
    expect(numbers).toEqual(expect.arrayContaining([198, 37, 120]));
    expect(await box.call('search_catalog', { query: 'chicken', maxKcal: 150 })).toMatchObject({ result: { foods: [] } });
    expect(await box.call('search_catalog', { query: 'chicken', minProteinPercent: 90 })).toMatchObject({ result: { foods: [] } });
    expect(await toolbox(false).forMeal(day, 'breakfast').call('search_catalog', { query: 'chicken' })).toMatchObject({ result: { foods: [] } });
  });

  it('price a move the model proposes, by the app’s arithmetic', async () => {
    const box = toolbox().forMeal(day, 'breakfast');
    const cut = await box.call('price_move', { kind: 'cutPortion', food: 'Buttermilk biscuit', keepShare: 0.5 });
    expect(cut.result).toMatchObject({ allowed: true, mealAfter: { kcal: 574, proteinG: 29, proteinPercent: 20 }, dayAfter: { kcalLeft: 1827, proteinToGoG: 141, fits: true } });
    const add = await box.call('price_move', { kind: 'addProtein', food: 'Buttermilk biscuit', other: { name: 'Chicken breast', kcal: 165, proteinG: 31 } });
    expect(add.result).toMatchObject({ allowed: true, mealAfter: { kcal: 1009, proteinG: 65 } });
    const unknown = await box.call('price_move', { kind: 'cutPortion', food: 'Croissant' });
    expect(unknown.result).toEqual({ error: 'No food called Croissant is logged today.' });
    const nothing = await box.call('no_such_tool', {});
    expect(nothing.result).toEqual({ error: 'No tool called no_such_tool.' });
  });
});

describe('the day’s tools', () => {
  it('say today’s meals, and the week and training once the brief is in', async () => {
    const box = toolbox().forDay(day);
    expect(box.tools.map((t) => t.name)).toEqual(['today_meals', 'week', 'training', 'my_foods_at_meal', 'search_catalog', 'price_move']);
    const { result } = await box.call('today_meals', {});
    expect(result).toMatchObject({ dayKcal: 844, dayProteinG: 34, kcalTarget: 2400 });
    expect((result as { meals: { meal: string; kcal: number }[] }).meals).toEqual([expect.objectContaining({ meal: 'breakfast', kcal: 844 })]);
    expect((await box.call('week', {})).result).toEqual({ error: 'The week is not read yet.' });
    expect((await box.call('training', {})).result).toEqual({ held: false });
  });
});
