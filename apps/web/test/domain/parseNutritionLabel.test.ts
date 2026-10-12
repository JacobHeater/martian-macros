import { expect, it } from 'vitest';
import { parseNutritionLabel } from '../../src/domain';

/** MM-44: reading the US Nutrition Facts layout from recognised text. */
const clean = `Nutrition Facts
8 servings per container
Serving size 2/3 cup (55g)
Amount per serving
Calories 230
% Daily Value*
Total Fat 8g 10%
Saturated Fat 1g 5%
Sodium 160mg 7%
Total Carbohydrate 37g 13%
Dietary Fiber 4g 14%
Total Sugars 12g
Protein 3g
`;

it('a clean panel is read in full', () => {
  const r = parseNutritionLabel(clean);
  expect(r.servingText).toBe('2/3 cup (55g)');
  expect(r.servingGrams).toBe(55);
  expect(r.kcal).toBe(230);
  expect(r.fatG).toBe(8);
  expect(r.carbsG).toBe(37);
  expect(r.proteinG).toBe(3);
  expect(r.fiberG).toBe(4);
  expect(r.sodiumMg).toBe(160);
});

it('calories from fat is not the calories', () => {
  const r = parseNutritionLabel('Calories from Fat 72\nCalories 230\nProtein 3g');
  expect(r.kcal).toBe(230);
});

it('a value on the line after its label is found', () => {
  const r = parseNutritionLabel('Calories\n230\nTotal Fat\n8g\nProtein\n3g');
  expect(r.kcal).toBe(230);
  expect(r.fatG).toBe(8);
  expect(r.proteinG).toBe(3);
});

it('the letter o read for a zero is repaired', () => {
  const r = parseNutritionLabel('Calories 2O0\nTotal Fat 1o g\nProtein 5g');
  expect(r.kcal).toBe(200);
  expect(r.fatG).toBe(10);
});

it('what is missing stays undefined, never zero', () => {
  const r = parseNutritionLabel('Calories 100\nProtein 2g');
  expect(r.carbsG).toBeUndefined();
  expect(r.fatG).toBeUndefined();
  expect(r.fiberG).toBeUndefined();
  expect(r.servingGrams).toBeUndefined();
});

it('text with no label is empty', () => {
  expect(parseNutritionLabel('hello world').isEmpty).toBe(true);
  expect(parseNutritionLabel('').isEmpty).toBe(true);
});
