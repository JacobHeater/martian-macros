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

// MM-309: the label's other lines, read only with an amount and its unit.
const full = `Nutrition Facts
Serving size 1 cup (240mL)
Calories 150
Total Fat 8g 10%
Sat. Fat 1g 5%
Trans Fat 0g
Cholesterol 0mg 0%
Sodium 160mg 7%
Total Carb. 12g 4%
Dietary Fiber 2g 7%
Total Sugars 12g
Incl. 10g Added Sugars 20%
Protein 8g
Vit. D 2mcg 10% Calcium 260mg 20%
Iron 8mg 45% Potassium 240mg 6%
Vitamin A 10% Vitamin C 15mg 15%
`;

it('the mandatory lines and any other nutrient with an amount are read', () => {
  const m = parseNutritionLabel(full).micros;
  expect(m.of('saturatedFat')).toBe(1);
  expect(m.of('cholesterol')).toBe(0);
  expect(m.of('sugars')).toBe(12);
  expect(m.of('vitaminD')).toBe(2);
  expect(m.of('calcium')).toBe(260);
  expect(m.of('iron')).toBe(8);
  expect(m.of('potassium')).toBe(240);
  expect(m.of('vitaminC')).toBe(15);
});

it('a nutrient printed with a percent only is left empty', () => {
  const m = parseNutritionLabel(full).micros;
  expect(m.of('vitaminA')).toBeUndefined();
  expect(m.of('zinc')).toBeUndefined();
});

it('added sugars are not taken for the total', () => {
  expect(parseNutritionLabel('Includes 10g Added Sugars\nTotal Sugars 14g').micros.of('sugars')).toBe(14);
});

it('vitamin D in IU is converted to micrograms', () => {
  expect(parseNutritionLabel('Vitamin D 100 IU').micros.of('vitaminD')).toBe(2.5);
});
