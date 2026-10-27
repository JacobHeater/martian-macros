import { expect, it } from 'vitest';
import { convertedQuantity } from '../../src/domain/food/portion/convertedQuantity';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { PortionUnit } from '../../src/domain/food/portion/PortionUnit';
import type { ReferenceNutrition } from '../../src/domain/food/portion/ReferenceNutrition';

/** MM-628: a unit change keeps the portion when the two units share an exact measure, and only then. */
const rice: ReferenceNutrition = {
  basis: 'per100g',
  nutrition: new NutritionTotals({ kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }),
};
const cupOfRice: ReferenceNutrition = { ...rice, servingDescription: '1 cup', servingGrams: 158, servingUnit: 'serving' };
const milk: ReferenceNutrition = { ...rice, densityGPerMl: 1.03 };

it('MM-628: weight to weight and volume to volume by their constants, with or without a food', () => {
  expect(convertedQuantity(180, { unit: 'gram' }, { unit: 'ounce' })).toBeCloseTo(6.3493, 4);
  expect(convertedQuantity(180 / PortionUnit.gramsPerOunce, { unit: 'ounce' }, { unit: 'gram' })).toBeCloseTo(180, 9);
  expect(convertedQuantity(2, { unit: 'cup' }, { unit: 'tablespoon' })).toBeCloseTo(32, 9);
});

it('MM-628: a serving with a weight converts through it', () => {
  expect(convertedQuantity(1.5, { unit: 'serving', reference: cupOfRice }, { unit: 'gram', reference: rice })).toBeCloseTo(237, 9);
  expect(convertedQuantity(316, { unit: 'gram', reference: rice }, { unit: 'serving', reference: cupOfRice })).toBeCloseTo(2, 9);
});

it('MM-628: a volume converts to weight only through the food’s own density', () => {
  expect(convertedQuantity(1, { unit: 'cup', reference: milk }, { unit: 'gram', reference: milk })).toBeCloseTo(243.69, 2);
  expect(convertedQuantity(1, { unit: 'cup', reference: rice }, { unit: 'gram', reference: rice }), 'no guessed density').toBeUndefined();
  expect(convertedQuantity(1, { unit: 'cup' }, { unit: 'gram' }), 'typed totals: no food to weigh').toBeUndefined();
});

it('MM-628: a hand portion never converts, either way', () => {
  const hand = { heightCm: 178, sex: 'male' as const };
  expect(convertedQuantity(180, { unit: 'gram', reference: rice }, { unit: 'palm', reference: rice }, { hand })).toBeUndefined();
  expect(convertedQuantity(1, { unit: 'palm', reference: rice }, { unit: 'gram', reference: rice }, { hand })).toBeUndefined();
});

it('MM-628: nothing converts from no amount', () => {
  expect(convertedQuantity(0, { unit: 'gram' }, { unit: 'ounce' })).toBeUndefined();
  expect(convertedQuantity(Number.NaN, { unit: 'gram' }, { unit: 'ounce' })).toBeUndefined();
});

// MM-632: the cup was 236.588236 mL, a digit short, so 16 tablespoons or 8 fl oz were not quite a cup.
it('MM-632: a cup is exactly 16 tablespoons, 48 teaspoons and 8 fluid ounces', () => {
  expect(PortionUnit.mlPerCup).toBe(16 * PortionUnit.mlPerTablespoon);
  expect(PortionUnit.mlPerCup).toBe(48 * PortionUnit.mlPerTeaspoon);
  expect(PortionUnit.mlPerCup).toBe(8 * PortionUnit.mlPerFluidOunce);
  expect(convertedQuantity(2, { unit: 'cup' }, { unit: 'tablespoon' })).toBe(32);
});
