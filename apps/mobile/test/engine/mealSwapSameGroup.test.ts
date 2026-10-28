import { describe, expect, it } from 'vitest';
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
      }
      // The order on this day is the protein food of the next meal, never the fillet for the biscuit.
      expect(analysis.moves.best?.kind).not.toBe('swapSameGroup');
    });
  }
});
