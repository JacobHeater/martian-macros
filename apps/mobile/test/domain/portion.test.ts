import { describe, expect, it } from 'vitest';
import {
  gramsFor,
  NutritionTotals,
  parseQuantity,
  PortionUnit,
  type ReferenceNutrition,
  scaleNutrition,
  unitsOffered,
} from '../../src/domain';
import { expectClose } from '../support/expectClose';

/** MM-167: quantities, units and scaling. Pure functions; no UI. */
const per100g: ReferenceNutrition = {
  basis: 'per100g',
  nutrition: new NutritionTotals({ kcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2 }),
};

describe('parseQuantity', () => {
  it('decimals and simple fractions', () => {
    expect(parseQuantity('1.5')).toBe(1.5);
    expect(parseQuantity('0.5')).toBe(0.5);
    expect(parseQuantity('.5')).toBe(0.5);
    expect(parseQuantity('1/2')).toBe(0.5);
    expect(parseQuantity('1 1/2')).toBe(1.5);
    expect(parseQuantity(' 2 ')).toBe(2);
    expect(parseQuantity('1,5')).toBe(1.5);
  });

  it('empty, zero, negative and non-numeric are rejected', () => {
    for (const bad of ['', '  ', '0', '0.0', '-2', 'abc', '1/0', '1/', '1..2']) {
      expect(parseQuantity(bad), `"${bad}"`).toBeUndefined();
    }
  });
});

describe('units', () => {
  it('ounces are weight, fluid ounces are volume', () => {
    expect(PortionUnit.isWeight('ounce')).toBe(true);
    expect(PortionUnit.isVolume('fluidOunce')).toBe(true);
    expect(PortionUnit.isWeight('fluidOunce')).toBe(false);
    expectClose(gramsFor(6, 'ounce', per100g), 170.1, 0.01);
    expect(gramsFor(1, 'fluidOunce', per100g)).toBeUndefined();
  });

  it('a cup is the US legal cup', () => {
    expectClose(PortionUnit.milliliters('cup'), 236.588, 0.001);
    expectClose(PortionUnit.milliliters('tablespoon'), 14.787, 0.001);
    expectClose(PortionUnit.milliliters('teaspoon'), 4.929, 0.001);
  });
});

describe('scaleNutrition', () => {
  it('150 g of a food stated per 100 g', () => {
    const t = scaleNutrition(150, 'gram', per100g);
    expectClose(t?.kcal, 78, 1e-9);
    expectClose(t?.proteinG, 0.45, 1e-9);
    expectClose(t?.carbsG, 21, 1e-9);
    expectClose(t?.fatG, 0.3, 1e-9);
  });

  it('1.5 label servings', () => {
    const bar: ReferenceNutrition = {
      basis: 'perServing',
      nutrition: new NutritionTotals({ kcal: 160, proteinG: 10, carbsG: 15, fatG: 6 }),
      servingDescription: '1 bar',
      servingGrams: 40,
    };
    expect(scaleNutrition(1.5, 'serving', bar)?.kcal).toBe(240);
    expect(gramsFor(1.5, 'serving', bar)).toBe(60);
    // 60 g is the same amount, reached by weight.
    expectClose(scaleNutrition(60, 'gram', bar)?.kcal, 240, 1e-9);
  });

  it('0.5 cup of a food with a serving defined in volume', () => {
    const milk: ReferenceNutrition = {
      basis: 'perServing',
      nutrition: new NutritionTotals({ kcal: 200, proteinG: 8, carbsG: 12, fatG: 8 }),
      servingDescription: '1 cup (240 mL)',
      servingGrams: 245,
      servingMilliliters: 240,
      servingUnit: 'cup',
    };
    // The source counts this serving in cups, so half a cup is half of it.
    const t = scaleNutrition(0.5, 'cup', milk);
    expect(t?.kcal).toBe(100);
    expect(gramsFor(0.5, 'cup', milk)).toBe(122.5);
    // A different volume unit goes through the serving's own millilitres.
    expectClose(scaleNutrition(1, 'tablespoon', milk)?.kcal, (200 * 14.78676478125) / 240, 1e-9);
  });

  it('a volume with no density and no volume serving does not convert', () => {
    expect(scaleNutrition(1, 'cup', per100g)).toBeUndefined();
    const withDensity: ReferenceNutrition = {
      basis: 'per100g',
      nutrition: new NutritionTotals({ kcal: 100, proteinG: 0, carbsG: 25, fatG: 0 }),
      densityGPerMl: 1.0,
    };
    expectClose(scaleNutrition(1, 'cup', withDensity)?.kcal, 236.588, 0.01);
  });

  it('hand portions and non-positive amounts are not scaled', () => {
    expect(scaleNutrition(2, 'cuppedHand', per100g)).toBeUndefined();
    expect(scaleNutrition(0, 'gram', per100g)).toBeUndefined();
    expect(scaleNutrition(-1, 'gram', per100g)).toBeUndefined();
    expect(scaleNutrition(Number.NaN, 'gram', per100g)).toBeUndefined();
  });

  it('per 100 mL references scale by volume', () => {
    const juice: ReferenceNutrition = {
      basis: 'per100ml',
      nutrition: new NutritionTotals({ kcal: 45, proteinG: 0.5, carbsG: 10, fatG: 0 }),
    };
    expectClose(scaleNutrition(250, 'milliliter', juice)?.kcal, 112.5, 1e-9);
    expect(scaleNutrition(100, 'gram', juice)).toBeUndefined();
  });
});

describe('unitsOffered', () => {
  it('each method offers its own units; Estimate offers none', () => {
    expect(unitsOffered('weighed')).toEqual(['gram', 'ounce']);
    expect(unitsOffered('labelServing')).toEqual(['serving']);
    expect(unitsOffered('palm')).toEqual(['palm']);
    expect(unitsOffered('cuppedHand')).toEqual(['cuppedHand']);
    expect(unitsOffered('thumb')).toEqual(['thumb']);
    expect(unitsOffered('quickAdd')).toEqual([]);
  });

  it('cup and spoon are offered only where the food can convert them', () => {
    expect(unitsOffered('householdMeasure', { reference: per100g })).toEqual([]);
    expect(unitsOffered('householdMeasure'), 'typed totals: the unit is only a description').toContain('cup');
    const dense: ReferenceNutrition = {
      basis: 'per100g',
      nutrition: new NutritionTotals({ kcal: 1, proteinG: 0, carbsG: 0, fatG: 0 }),
      densityGPerMl: 0.9,
    };
    expect(unitsOffered('householdMeasure', { reference: dense })).toContain('tablespoon');
    // The fluid ounce is a volume like the millilitre, for every food that converts volumes (MM-658).
    expect(unitsOffered('householdMeasure', { reference: dense })).toContain('fluidOunce');
    expect(unitsOffered('householdMeasure')).toContain('fluidOunce');
  });
});
