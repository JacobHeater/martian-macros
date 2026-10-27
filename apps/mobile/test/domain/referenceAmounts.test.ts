import { describe, expect, it } from 'vitest';
import { convertedQuantity } from '../../src/domain/food/portion/convertedQuantity';
import { gramsFor } from '../../src/domain/food/portion/gramsFor';
import { millilitersFor } from '../../src/domain/food/portion/millilitersFor';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { referenceAmounts } from '../../src/domain/food/portion/referenceAmounts';
import type { ReferenceNutrition } from '../../src/domain/food/portion/ReferenceNutrition';
import { scaleNutrition } from '../../src/domain/food/portion/scaleNutrition';
import { unitsOffered } from '../../src/domain/food/portion/unitsOffered';
import { expectClose } from '../support/expectClose';

/**
 * MM-650, MM-651: a food stated per 100 mL scales by the millilitres eaten:
 * its serving by the millilitres the source states, a volume exactly, a
 * weight only through a density. Nothing is guessed.
 */
const mlPerFluidOunce = 29.5735295625;

const cola: ReferenceNutrition = {
  basis: 'per100ml',
  nutrition: new NutritionTotals({ kcal: 42, proteinG: 0, carbsG: 10.6, fatG: 0 }),
  servingDescription: '1 can (355 mL)',
  servingMilliliters: 355,
  servingUnit: 'serving',
};

const milk: ReferenceNutrition = {
  basis: 'per100ml',
  nutrition: new NutritionTotals({ kcal: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3 }),
  servingDescription: '1 cup (240 mL)',
  servingMilliliters: 240,
  servingUnit: 'serving',
  densityGPerMl: 1.03,
};

const rice: ReferenceNutrition = {
  basis: 'per100g',
  nutrition: new NutritionTotals({ kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }),
  servingDescription: '1 cup',
  servingGrams: 158,
  servingMilliliters: 236.5882365,
  servingUnit: 'serving',
};

const bar: ReferenceNutrition = {
  basis: 'perServing',
  nutrition: new NutritionTotals({ kcal: 200, proteinG: 20, carbsG: 20, fatG: 5 }),
  servingDescription: '1 bar',
  servingGrams: 40,
  servingUnit: 'serving',
};

describe('referenceAmounts (MM-650)', () => {
  it('per 100 mL: a serving by its millilitres, a volume exactly, a weight only through a density', () => {
    expectClose(referenceAmounts(1, 'serving', cola), 3.55, 1e-9);
    expectClose(referenceAmounts(12, 'fluidOunce', cola), (12 * mlPerFluidOunce) / 100, 1e-9);
    expectClose(referenceAmounts(250, 'milliliter', cola), 2.5, 1e-9);
    expect(referenceAmounts(100, 'gram', cola), 'no density: a weight is not guessed').toBeUndefined();
    expectClose(referenceAmounts(103, 'gram', milk), 1, 1e-9);
    expect(referenceAmounts(1, 'cuppedHand', cola), 'a drink is poured, not held').toBeUndefined();
  });

  it('per 100 g and per serving are the grams over 100 and the servings, as before', () => {
    expectClose(referenceAmounts(79, 'gram', rice), 0.79, 1e-9);
    expectClose(referenceAmounts(2, 'tablespoon', rice), ((2 * 14.78676478125) / 236.5882365) * 1.58, 1e-9);
    expect(referenceAmounts(2, 'serving', bar)).toBe(2);
    expectClose(referenceAmounts(20, 'gram', bar), 0.5, 1e-9);
    expect(referenceAmounts(0, 'gram', rice)).toBeUndefined();
  });

  it('scaleNutrition is the nutrition times the amounts, extras included by the same multiple', () => {
    expectClose(scaleNutrition(1, 'serving', cola)?.kcal, 149.1, 1e-9);
    expectClose(scaleNutrition(12, 'fluidOunce', cola)?.carbsG, (10.6 * 12 * mlPerFluidOunce) / 100, 1e-9);
    expect(scaleNutrition(100, 'gram', cola)).toBeUndefined();
    expectClose(scaleNutrition(2, 'serving', bar)?.kcal, 400, 1e-9);
  });
});

describe('millilitersFor and the grams of a volume serving (MM-650)', () => {
  it('a serving counts by its millilitres, or its grams through the density; a weight through the density', () => {
    expectClose(millilitersFor(1, 'serving', milk), 240, 1e-9);
    expectClose(millilitersFor(206, 'gram', milk), 200, 1e-9);
    expect(millilitersFor(100, 'gram', cola)).toBeUndefined();
    expect(millilitersFor(1, 'palm', cola)).toBeUndefined();
    const juiceByWeight: ReferenceNutrition = { ...cola, servingDescription: '1 cup', servingMilliliters: undefined, servingGrams: 248, densityGPerMl: 1.04 };
    expectClose(millilitersFor(1, 'serving', juiceByWeight), 248 / 1.04, 1e-9);
  });

  it('gramsFor weighs a serving stated only in millilitres through the density, or not at all', () => {
    expectClose(gramsFor(1, 'serving', milk), 247.2, 1e-9);
    expect(gramsFor(1, 'serving', cola)).toBeUndefined();
  });

  it('convertedQuantity: a can into fluid ounces and back through the volume; into grams only with a density', () => {
    const from = (unit: 'serving' | 'fluidOunce' | 'gram', reference: ReferenceNutrition) => ({ unit, reference });
    expectClose(convertedQuantity(1, from('serving', cola), from('fluidOunce', cola)), 355 / mlPerFluidOunce, 1e-9);
    expectClose(convertedQuantity(12, from('fluidOunce', cola), from('serving', cola)), (12 * mlPerFluidOunce) / 355, 1e-9);
    expect(convertedQuantity(1, from('serving', cola), from('gram', cola))).toBeUndefined();
    expectClose(convertedQuantity(1, from('serving', milk), from('gram', milk)), 247.2, 1e-9);
  });

  it('unitsOffered: every volume, fluid ounces too, for a per-100 mL reference', () => {
    expect(unitsOffered('householdMeasure', { reference: cola })).toEqual(['cup', 'tablespoon', 'teaspoon', 'milliliter', 'fluidOunce']);
  });
});
