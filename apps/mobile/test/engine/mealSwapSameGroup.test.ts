import { describe, expect, it } from 'vitest';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryTradeCatalog } from '../../src/fixtures/InMemoryTradeCatalog';
import { isSameFoodName } from '../../src/engine/analysis/food/isSameFoodName';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import { catalogFood, catalogOf, day, logged } from './support/movesFixtures';
import { safeguards } from './support/foodAnalysis';

/**
 * MM-683: the owner's breakfast breakdown, on a build of main made moments
 * before, swapped the biscuit for the chicken fillet the person logs at
 * breakfast. A swap is within the food's group or none; a food of another
 * kind never stands in a food's place, on the plate or off it.
 */
describe('a meal’s swap', () => {
  const fillet = 'Just Bare Lightly Breaded Chicken Breast Fillet';
  const biscuit = catalogFood(1, 'Biscuit, home recipe', 'breadsAndGrains', 541, 10, 27);
  const filletFood = catalogFood(2, 'Just Bare lightly breaded chicken breast original fillet', 'meatAndPoultry', 216, 22, 9);
  const breakfast = (withFillet: boolean) => [
    logged(day, 'breakfast', 'Biscuit, home recipe', 541, 10, 27, { fromFoodId: 1 }),
    logged(day, 'breakfast', 'Large eggs', 143, 13, 10),
    ...(withFillet ? [logged(day, 'breakfast', fillet, 216, 22, 9, { fromFoodId: 2 })] : []),
  ];
  const earlier = [1, 2, 3].map((ago) => logged(day.addDays(-ago), 'breakfast', fillet, 216, 22, 9, { fromFoodId: 2 }));

  for (const onThePlate of [true, false]) {
    it(`is never a food of another group, the fillet ${onThePlate ? 'on' : 'off'} today’s plate`, () => {
      const plate = breakfast(onThePlate);
      const analysis = mealBreakdownAnalysisOf({
        meal: 'breakfast',
        mealEntries: plate,
        dayEntries: plate,
        candidates: [...plate, ...earlier],
        catalog: catalogOf(biscuit, filletFood),
        kcalTarget: 2177,
        proteinTargetG: 187,
        safeguards: safeguards(),
      });
      expect(analysis.outlierItem?.name).toBe('Biscuit, home recipe');
      for (const move of analysis.moves.moves) {
        if (move.kind !== 'swapSameGroup') continue;
        expect(isSameFoodName(move.replacement.name, fillet), move.replacement.name).toBe(false);
        // A swap stays in the bread's own group: the person's bagel, the catalog's, or the table's words, never a chicken.
        expect(move.replacement.name).not.toMatch(/chicken/i);
      }
    });
  }
});

/**
 * MM-710: a saved food with a group is of that group, so the swap may stand
 * a catalog food of the group in its place; a saved food without one gets
 * no swap, as before.
 */
describe('a saved food’s swap', () => {
  const bagel = catalogFood(3, 'Whole wheat bagel', 'breadsAndGrains', 250, 10, 1.5);
  const savedBiscuit = (group: boolean) =>
    new FoodEntry({
      id: 500,
      date: day,
      meal: 'breakfast',
      name: 'Buttermilk biscuit',
      kcal: 541,
      proteinG: 10,
      carbsG: 54,
      fatG: 27,
      source: 'labelServing',
      portion: {
        method: 'labelServing',
        basis: 'calculated',
        quantity: 1,
        unit: 'serving',
        reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: 541, proteinG: 10, carbsG: 54, fatG: 27 }) },
        origin: { packId: 'custom', foodId: group ? 7 : 8, source: 'user' },
      },
    });
  const analysisOf = (entry: FoodEntry) =>
    mealBreakdownAnalysisOf({
      meal: 'breakfast',
      mealEntries: [entry, logged(day, 'breakfast', 'Large eggs', 143, 13, 10)],
      dayEntries: [entry, logged(day, 'breakfast', 'Large eggs', 143, 13, 10)],
      candidates: [entry],
      catalog: new InMemoryTradeCatalog([bagel], { savedFoodGroups: new Map([[7, 'breadsAndGrains']]) }),
      kcalTarget: 2177,
      proteinTargetG: 187,
      safeguards: safeguards(),
    });

  it('offers the catalog bagel in the saved biscuit’s place when the biscuit has a group', () => {
    const analysis = analysisOf(savedBiscuit(true));
    expect(analysis.outlierItem?.name).toBe('Buttermilk biscuit');
    const swap = analysis.moves.moves.find((move) => move.kind === 'swapSameGroup');
    expect(swap?.kind === 'swapSameGroup' ? swap.replacement.name : undefined).toBe('Whole wheat bagel');
  });

  it('offers no swap for a saved biscuit without a group', () => {
    const analysis = analysisOf(savedBiscuit(false));
    expect(analysis.moves.moves.some((move) => move.kind === 'swapSameGroup')).toBe(false);
  });
});
