import { describe, expect, it } from 'vitest';
import {
  compositionDensity,
  gramsFor,
  HandModel,
  handUnitsFor,
  type HandSize,
  NutritionTotals,
  type ReferenceNutrition,
  scaleNutrition,
} from '../../src/domain';
import { expectClose } from '../support/expectClose';

/** MM-46: hand portions become grams of the chosen food. */
const man: HandSize = { heightCm: 190, sex: 'male' };
const woman: HandSize = { heightCm: 155, sex: 'female' };
const chicken: ReferenceNutrition = {
  basis: 'per100g',
  nutrition: new NutritionTotals({ kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 }),
};

it('the hand matters: a taller man logs more than a shorter woman', () => {
  const his = gramsFor(1, 'palm', chicken, { hand: man }) as number;
  const hers = gramsFor(1, 'palm', chicken, { hand: woman }) as number;
  expect(his).toBeGreaterThan(hers);
  expect(his).toBeGreaterThanOrEqual(100);
  expect(his).toBeLessThanOrEqual(170);
  expect(hers).toBeGreaterThanOrEqual(55);
  expect(hers).toBeLessThanOrEqual(90);
});

it('a reference person gets the reference portion', () => {
  const ref: HandSize = { heightCm: 178, sex: 'male' };
  expectClose(HandModel.millilitersOf('palm', ref), 110, 1e-9);
});

it('the food matters: its own density wins over the default', () => {
  const dense: ReferenceNutrition = {
    basis: 'per100g',
    nutrition: new NutritionTotals({ kcal: 100, proteinG: 10, carbsG: 10, fatG: 1 }),
    densityGPerMl: 1.3,
  };
  expect(gramsFor(1, 'palm', dense, { hand: man }) as number).toBeGreaterThan(
    gramsFor(1, 'palm', chicken, { hand: man }) as number,
  );
});

it('without a hand size a hand portion cannot be converted', () => {
  expect(gramsFor(1, 'palm', chicken)).toBeUndefined();
  expect(scaleNutrition(1, 'palm', chicken)).toBeUndefined();
});

it('nutrition scales from the grams the hand implies', () => {
  const grams = gramsFor(2, 'palm', chicken, { hand: man }) as number;
  const totals = scaleNutrition(2, 'palm', chicken, { hand: man });
  expectClose(totals?.kcal, (165 * grams) / 100, 1e-9);
  expectClose(totals?.proteinG, (31 * grams) / 100, 1e-9);
});

it('non-hand units are not affected', () => {
  expect(HandModel.gramsOf('gram', man)).toBeUndefined();
  expect(gramsFor(100, 'gram', chicken, { hand: man })).toBe(100);
});

const salmon: ReferenceNutrition = {
  basis: 'per100g',
  nutrition: new NutritionTotals({ kcal: 208, proteinG: 20, carbsG: 0, fatG: 13 }),
};

it('the food matters: a palm of salmon and a palm of chicken breast differ in weight and macros', () => {
  const salmonG = gramsFor(1, 'palm', salmon, { hand: man }) as number;
  const chickenG = gramsFor(1, 'palm', chicken, { hand: man }) as number;
  expect(salmonG).not.toBeCloseTo(chickenG, 0);
  // Fat is lighter than protein, so the fattier fish weighs less in the same palm.
  expect(salmonG).toBeLessThan(chickenG);
  const salmonTotals = scaleNutrition(1, 'palm', salmon, { hand: man });
  const chickenTotals = scaleNutrition(1, 'palm', chicken, { hand: man });
  expect(salmonTotals?.proteinG).not.toBeCloseTo(chickenTotals?.proteinG ?? 0, 0);
  expect(salmonTotals?.kcal).not.toBeCloseTo(chickenTotals?.kcal ?? 0, 0);
});

it('density from makeup: water is about 1, fat lighter, protein and sugar heavier', () => {
  expectClose(compositionDensity(new NutritionTotals({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 })), 0.997, 1e-9);
  expect(compositionDensity(new NutritionTotals({ kcal: 900, proteinG: 0, carbsG: 0, fatG: 100 }))).toBeLessThan(0.95);
  expect(compositionDensity(chicken.nutrition) as number).toBeGreaterThan(1.05);
  expect(compositionDensity(chicken.nutrition) as number).toBeLessThan(1.1);
  expect(compositionDensity(new NutritionTotals({ kcal: 0, proteinG: 60, carbsG: 30, fatG: 20 })), 'not a possible 100 g').toBeUndefined();
});

it("a cupped hand is a heap and keeps its default; a food's own density still wins", () => {
  const rice: ReferenceNutrition = {
    basis: 'per100g',
    nutrition: new NutritionTotals({ kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }),
  };
  expectClose(gramsFor(1, 'cuppedHand', rice, { hand: man }), (HandModel.millilitersOf('cuppedHand', man) as number) * 0.65, 1e-9);
  expectClose(gramsFor(1, 'palm', { ...salmon, densityGPerMl: 1.2 }, { hand: man }), (HandModel.millilitersOf('palm', man) as number) * 1.2, 1e-9);
});

it('a per-serving food has no makeup per 100 g, so a palm takes the default', () => {
  const perServing: ReferenceNutrition = { ...salmon, basis: 'perServing', servingGrams: 150, servingUnit: 'serving' };
  expectClose(gramsFor(1, 'palm', perServing, { hand: man }), HandModel.millilitersOf('palm', man) as number, 1e-9);
});

describe('the fitting portion is offered first', () => {
  it('meat and fish by palm, fats by thumb, grains and fruit by cupped hand', () => {
    expect(handUnitsFor(chicken.nutrition)[0]).toBe('palm');
    expect(handUnitsFor(salmon.nutrition)[0]).toBe('palm');
    expect(handUnitsFor(new NutritionTotals({ kcal: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81 }))[0]).toBe('thumb');
    expect(handUnitsFor(new NutritionTotals({ kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }))[0]).toBe('cuppedHand');
    expect(handUnitsFor(new NutritionTotals({ kcal: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3 }))[0]).toBe('cuppedHand');
  });

  it('every hand portion is still offered', () => {
    for (const food of [chicken.nutrition, salmon.nutrition, undefined]) {
      expect([...handUnitsFor(food)].sort()).toEqual(['cuppedHand', 'palm', 'thumb']);
    }
  });
});
