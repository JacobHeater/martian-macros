import { expect, it } from 'vitest';
import {
  gramsFor,
  HandModel,
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
