import { describe, expect, it } from 'vitest';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import { everydayProteinRankOf } from '../../src/engine/analysis/moves/everydayProteinRankOf';
import { catalogFood, catalogOf, day, logged } from './support/movesFixtures';
import { safeguards } from './support/foodAnalysis';

/**
 * MM-688: the coach names a lean protein food a person would buy and cook.
 * The owner's brief of 2026-10-28 said "Adding a beaver beside it": the
 * catalog's meat group holds game and offal, and the most protein inside
 * the cap won.
 */
const beaver = catalogFood(1, 'Beaver', 'meatAndPoultry', 284, 47, 12);
const armadillo = catalogFood(2, 'Armadillo', 'meatAndPoultry', 215, 38, 6);
const breadedTenders = catalogFood(3, 'Chicken breast tenders, breaded, cooked, microwaved', 'meatAndPoultry', 200, 30, 5);
const chickenBreast = catalogFood(4, 'Chicken breast, baked, broiled, or roasted, skin not eaten, from raw', 'meatAndPoultry', 209, 39, 4.6);
const yellowtail = catalogFood(5, 'Fish, yellowtail, mixed species, cooked, dry heat', 'fish', 273, 43, 10);
const clams = catalogFood(6, 'Clams, canned', 'fish', 50, 9, 0.6);
const eggWhite = catalogFood(7, 'Egg, white, cooked', 'eggs', 52, 11, 0.2);

describe('the everyday list', () => {
  it('ranks chicken breast first and leaves game, offal and breaded or raw forms off', () => {
    expect(everydayProteinRankOf({ name: chickenBreast.food.name, group: 'meatAndPoultry' })).toBe(0);
    expect(everydayProteinRankOf({ name: 'Fish, cod, cooked, dry heat', group: 'fish' })).toBeGreaterThan(0);
    expect(everydayProteinRankOf({ name: 'Yogurt, Greek, plain, nonfat', group: 'dairyAndYogurt' })).toBeGreaterThan(0);
    for (const name of ['Beaver', 'Game meat, beaver, cooked, roasted', 'Armadillo', 'Beef, variety meats and by-products, heart, cooked']) {
      expect(everydayProteinRankOf({ name, group: 'meatAndPoultry' }), name).toBeUndefined();
    }
    for (const name of [breadedTenders.food.name, 'Chicken breast, raw', 'Chicken breast, fried, coated, skin / coating eaten', 'Chicken salad']) {
      expect(everydayProteinRankOf({ name, group: 'meatAndPoultry' }), name).toBeUndefined();
    }
    // A fish is not a chicken: the pattern holds to its group.
    expect(everydayProteinRankOf({ name: 'Tuna', group: 'meatAndPoultry' })).toBeUndefined();
  });
});

describe('the food the coach names', () => {
  it('adds chicken breast to lunch, not the beaver with more protein', () => {
    const breakfast = [logged(day, 'breakfast', 'Greek yogurt', 377, 55, 2)];
    const lunch = [logged(day, 'lunch', 'French fries', 420, 5, 20), logged(day, 'lunch', 'Burger patty', 280, 17, 22)];
    const analysis = mealBreakdownAnalysisOf({
      meal: 'lunch',
      mealEntries: lunch,
      dayEntries: [...breakfast, ...lunch],
      candidates: [...breakfast, ...lunch],
      catalog: catalogOf(beaver, armadillo, breadedTenders, chickenBreast, yellowtail),
      kcalTarget: 2177,
      proteinTargetG: 187,
      safeguards: safeguards(),
    });
    const add = analysis.moves.moves.find((move) => move.kind === 'addProtein');
    expect(add?.kind).toBe('addProtein');
    if (add?.kind !== 'addProtein') return;
    expect(add.added.name).toBe(chickenBreast.food.name);
    expect(add.added.proteinG).toBe(39);
    for (const move of analysis.moves.moves) expect(JSON.stringify(move)).not.toMatch(/Beaver|Armadillo|yellowtail|breaded/);
  });

  it('names egg whites, not a can of clams, as the closest when only a few calories are left', () => {
    const breakfast = [logged(day, 'breakfast', 'Buttermilk biscuit', 541, 10, 27), logged(day, 'breakfast', 'Large eggs', 303, 24, 20)];
    const lunch = [logged(day, 'lunch', 'Turkey sandwich', 1273, 53, 50)];
    const analysis = mealBreakdownAnalysisOf({
      meal: 'breakfast',
      mealEntries: breakfast,
      dayEntries: [...breakfast, ...lunch],
      candidates: [...breakfast, ...lunch],
      catalog: catalogOf(beaver, chickenBreast, clams, eggWhite),
      kcalTarget: 2177,
      proteinTargetG: 187,
      safeguards: safeguards(),
    });
    expect(analysis.kcalRemaining).toBe(60);
    const best = analysis.moves.best;
    expect(best?.kind).toBe('nextMeal');
    if (best?.kind !== 'nextMeal') return;
    expect(best.fits).toBe(false);
    expect(best.food?.name).toBe('Egg, white, cooked');
  });
});
