import { expect, it } from 'vitest';
import { checkNutrition, macrosMatchEnergy, type NutritionPer100g } from '../../src/domain';

/** A sound food, with whatever is given changed. A key given as undefined is left out by the source. */
const food = (changes: Partial<NutritionPer100g> = {}): NutritionPer100g => ({
  name: 'Food',
  kcal: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 3.6,
  ...changes,
});

it('a sound entry is valid', () => {
  expect(checkNutrition(food())).toBeUndefined();
});

it('units entered wrongly: macros over 100 g', () => {
  expect(checkNutrition(food({ kcal: 52, proteinG: 300, carbsG: 0, fatG: 0 }))).toBe('macrosExceed100g');
});

it('kilojoules entered as kilocalories', () => {
  expect(checkNutrition(food({ kcal: 690 }))).toBe('energyDisagreesWithMacros');
});

it('a high-fiber food that only matches with fiber at 2 kcal', () => {
  // 40 g carbohydrate of which 30 g fiber: 4*40 = 160 as stated, but
  // 4*10 + 2*30 = 100 with fiber at 2 kcal per gram.
  const f = food({ kcal: 100, proteinG: 0, carbsG: 40, fatG: 0, fiberG: 30 });
  expect(checkNutrition(f)).toBeUndefined();
  expect(
    checkNutrition(food({ kcal: 100, proteinG: 0, carbsG: 40, fatG: 0 })),
    'without the fiber figure it does not match',
  ).toBe('energyDisagreesWithMacros');
});

it('water and diet drinks are valid', () => {
  expect(checkNutrition(food({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }))).toBeUndefined();
});

it('alcohol counts 7 kcal per gram', () => {
  expect(checkNutrition(food({ kcal: 70, proteinG: 0, carbsG: 0, fatG: 0, alcoholG: 10 }))).toBeUndefined();
});

it('the other reasons', () => {
  expect(checkNutrition(food({ name: ' ' }))).toBe('missingName');
  expect(checkNutrition(food({ kcal: undefined }))).toBe('missingValue');
  expect(checkNutrition(food({ fatG: undefined }))).toBe('missingValue');
  expect(checkNutrition(food({ carbsG: -1 }))).toBe('negativeValue');
  expect(checkNutrition(food({ kcal: 950, proteinG: 0, carbsG: 0, fatG: 100 }))).toBe('energyTooHigh');
});

it('the typed-entry check is the same rule', () => {
  expect(macrosMatchEnergy({ kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 })).toBe(true);
  expect(macrosMatchEnergy({ kcal: 690, proteinG: 31, carbsG: 0, fatG: 3.6 })).toBe(false);
});
