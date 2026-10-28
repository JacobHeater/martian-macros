import { describe, expect, it } from 'vitest';
import { isSameFoodName } from '../../src/engine/analysis/food/isSameFoodName';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import { food, today, yesterday } from './support/foodAnalysis';

/**
 * MM-674: the owner's breakfast breakdown offered the chicken fillet in place of the biscuit beside it. A food
 * already on the plate is no swap for what else is on it, under its own spelling or the catalog's.
 */
describe('a meal’s suggested swap', () => {
  const fillet = 'Just Bare Lightly Breaded Chicken Breast Fillet';

  it('is never a food already in the meal', () => {
    const breakfast = [
      food(today, 'breakfast', 'Biscuit, home recipe', 315, 6, 14),
      food(today, 'breakfast', 'LARGE EGGS', 60, 6, 4),
      food(today, 'breakfast', fillet, 295, 16, 18),
    ];
    const history = [
      ...breakfast,
      food(yesterday, 'breakfast', fillet, 295, 16, 18),
      food(yesterday, 'breakfast', 'Biscuit, home recipe', 315, 6, 14),
      food(yesterday, 'lunch', 'Turkey breast wrap', 340, 38, 6),
    ];
    const analysis = mealBreakdownAnalysisOf({
      meal: 'breakfast',
      mealEntries: breakfast,
      dayEntries: breakfast,
      candidates: history,
      kcalTarget: 2177,
      proteinTargetG: 187,
      protectedPath: false,
    });
    expect(analysis.outlierItem?.name).toBe('Biscuit, home recipe');
    for (const move of analysis.moves.moves) {
      const named = move.kind === 'swapSameGroup' ? move.replacement.name : move.kind === 'addProtein' ? move.added.name : move.kind === 'nextMeal' ? move.food?.name : undefined;
      if (named === undefined) continue;
      expect(isSameFoodName(named, fillet), named).toBe(false);
      expect(isSameFoodName(named, 'LARGE EGGS'), named).toBe(false);
    }
  });

  it('knows a food under the catalog’s spelling of it', () => {
    expect(isSameFoodName(fillet, 'Just Bare lightly breaded chicken breast original fillet')).toBe(true);
    expect(isSameFoodName('General Tso chicken', 'Almond chicken')).toBe(false);
    expect(isSameFoodName('Chicken', 'Chicken breast')).toBe(false);
    expect(isSameFoodName('Biscuit, home recipe', 'biscuit, home recipe')).toBe(true);
  });
});
