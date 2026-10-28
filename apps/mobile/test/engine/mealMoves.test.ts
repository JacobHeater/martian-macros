import { describe, expect, it } from 'vitest';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import { foodMovesOf } from '../../src/engine/analysis/moves/foodMovesOf';
import { mealMoveOrder } from '../../src/format/coach/mealMoveOrder';
import { mealMovesText } from '../../src/format/coach/mealMovesText';
import { catalogFood, catalogOf, day, logged } from './support/movesFixtures';
import { safeguards } from './support/foodAnalysis';

/**
 * MM-684: one move per meal, ranked by the day's gap, said in the lines
 * the owner approved (MM-682, 2026-10-28), word for word.
 */
const chickenBreast = catalogFood(1, 'Chicken breast', 'meatAndPoultry', 165, 31, 3.6);

describe('the meal’s move and the coach’s words', () => {
  it('A: the owner’s breakfast, where the protein to go cannot fit: today’s order first', () => {
    const breakfast = [logged(day, 'breakfast', 'Buttermilk biscuit', 541, 10, 27), logged(day, 'breakfast', 'Large eggs', 303, 24, 20)];
    const lunch = [logged(day, 'lunch', 'Turkey sandwich', 986, 53, 40)];
    const analysis = mealBreakdownAnalysisOf({
      meal: 'breakfast',
      mealEntries: breakfast,
      dayEntries: [...breakfast, ...lunch],
      candidates: [...breakfast, ...lunch],
      catalog: catalogOf(chickenBreast),
      kcalTarget: 2177,
      proteinTargetG: 187,
      safeguards: safeguards(),
    });
    expect(analysis.kcalRemaining).toBe(347);
    expect(analysis.proteinRemainingG).toBe(100);
    expect(analysis.proteinUnrecoverable).toBe(true);
    expect(analysis.outlierItem?.name).toBe('Buttermilk biscuit');
    expect(analysis.moves.best?.kind).toBe('nextMeal');
    expect(mealMovesText(analysis)).toBe(
      'Breakfast took 844 kcal, 39% of your day, for 34 g of protein. The buttermilk biscuit is the drag: 541 kcal for 10 g. ' +
        '347 kcal left and 100 g of protein to go does not fit. Hold the 347 and spend every one of them on lean protein: ' +
        'chicken breast, 165 kcal for 31 g, is the closest you get. Protein first tomorrow morning.',
    );
  });

  it('B: room in the day and the meal built wrong: add a protein food next time, and the next meal carries today', () => {
    const breakfast = [logged(day, 'breakfast', 'Oats with whey', 600, 38, 12)];
    const lunch = [logged(day, 'lunch', 'Fries', 420, 5, 20), logged(day, 'lunch', 'Turkey sandwich', 280, 17, 8)];
    const analysis = mealBreakdownAnalysisOf({
      meal: 'lunch',
      mealEntries: lunch,
      dayEntries: [...breakfast, ...lunch],
      candidates: [...breakfast, ...lunch],
      catalog: catalogOf(chickenBreast),
      kcalTarget: 2400,
      proteinTargetG: 170,
      safeguards: safeguards(),
    });
    expect(analysis.outlierItem?.name).toBe('Fries');
    expect(analysis.moves.best?.kind).toBe('addProtein');
    expect(mealMovesText(analysis)).toBe(
      'Lunch was 700 kcal for 22 g of protein, 13% protein. The fries are the drag: 420 kcal for 5 g. ' +
        'Next time build it around protein: add chicken breast, 165 kcal for 31 g, and lunch stands at 53 g. ' +
        'You have 1,100 kcal left for 110 g today. Dinner carries it.',
    );
  });

  it('C: the day’s protein covered and a food of the same group logged at that slot: the swap', () => {
    const croissant = catalogFood(2, 'Croissant', 'breadsAndGrains', 300, 6, 17);
    const bagel = catalogFood(3, 'Whole wheat bagel', 'breadsAndGrains', 250, 10, 2);
    const breakfast = [logged(day, 'breakfast', 'Croissant', 300, 6, 17, { fromFoodId: 2 }), logged(day, 'breakfast', 'Cafe latte', 220, 12, 8)];
    const dinner = [logged(day, 'dinner', 'Chicken and rice', 1200, 160, 20)];
    const bagels = [1, 2].map((ago) => logged(day.addDays(-ago), 'breakfast', 'Whole wheat bagel', 250, 10, 2, { fromFoodId: 3 }));
    const analysis = mealBreakdownAnalysisOf({
      meal: 'breakfast',
      mealEntries: breakfast,
      dayEntries: [...breakfast, ...dinner],
      candidates: [...bagels, ...breakfast, ...dinner],
      catalog: catalogOf(chickenBreast, croissant, bagel),
      kcalTarget: 2400,
      proteinTargetG: 170,
      safeguards: safeguards(),
    });
    expect(analysis.proteinRemainingG).toBe(0);
    expect(analysis.outlierItem?.name).toBe('Croissant');
    expect(analysis.moves.best?.kind).toBe('swapSameGroup');
    expect(mealMovesText(analysis)).toBe(
      'Breakfast was 520 kcal for 18 g of protein. The croissant is the drag: 300 kcal for 6 g. ' +
        'Swap it for a whole wheat bagel, 250 kcal for 10 g: 50 kcal back and 4 g more protein, same breakfast.',
    );
  });

  it('the inline line under the biscuit, with no catalog and nothing of the person’s to add: the cut', () => {
    const biscuit = logged(day, 'breakfast', 'Buttermilk biscuit', 541, 10, 27);
    const breakfast = [biscuit, logged(day, 'breakfast', 'Large eggs', 303, 24, 20)];
    const [move] = foodMovesOf(
      {
        meal: 'breakfast',
        mealEntries: breakfast,
        dayEntries: breakfast,
        dailyKcalTarget: 2177,
        dailyProteinTargetG: 187,
        goal: 'fatLoss',
        history: breakfast,
        catalog: undefined,
        safeguards: safeguards(),
        cautions: new Set(),
      },
      biscuit,
    );
    expect(move?.kind).toBe('cutPortion');
    expect(`Light on protein: 541 kcal for 10 g. ${mealMoveOrder(move!, 'breakfast', 'inline')}`).toBe(
      'Light on protein: 541 kcal for 10 g. Half of it next time keeps 271 kcal for protein.',
    );
  });

  it('says nothing to order when the meal is fine and the day’s protein is covered', () => {
    const lunch = [logged(day, 'lunch', 'Chicken and rice', 600, 55, 10)];
    const analysis = mealBreakdownAnalysisOf({
      meal: 'lunch',
      mealEntries: lunch,
      dayEntries: [...lunch, logged(day, 'breakfast', 'Greek yogurt', 400, 60, 5), logged(day, 'dinner', 'Salmon', 700, 60, 30)],
      candidates: lunch,
      catalog: catalogOf(chickenBreast),
      kcalTarget: 2400,
      proteinTargetG: 170,
      safeguards: safeguards(),
    });
    expect(analysis.outlierItem).toBeUndefined();
    expect(analysis.moves.best).toBeUndefined();
    expect(mealMovesText(analysis)).toBe('Lunch was 600 kcal for 55 g of protein. Protein is covered today with 700 kcal left. Hold the line.');
  });

  it('names nothing and orders nothing on the protected path', () => {
    const lunch = [logged(day, 'lunch', 'Fries', 420, 5, 20)];
    const analysis = mealBreakdownAnalysisOf({
      meal: 'lunch',
      mealEntries: lunch,
      dayEntries: lunch,
      candidates: lunch,
      catalog: catalogOf(chickenBreast),
      kcalTarget: 2400,
      proteinTargetG: 170,
      safeguards: safeguards({ eatingDisorderHistory: true }),
    });
    expect(analysis.protectedPath).toBe(true);
    expect(analysis.moves.moves).toEqual([]);
    expect(mealMovesText(analysis)).not.toMatch(/kcal|drag/);
  });
});
