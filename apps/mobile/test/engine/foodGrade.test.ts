import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { FoodGradeLetter } from '../../src/domain/food/grade/FoodGradeLetter';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { gradeLetterOf } from '../../src/engine/gradeLetterOf';
import { gradeOfCatalogFood } from '../../src/food/gradeOfCatalogFood';
import { gradeOfCustomFood } from '../../src/engine/gradeOfCustomFood';
import { gradeOfFoodEntry } from '../../src/engine/gradeOfFoodEntry';
import { gradeOfMeal } from '../../src/engine/gradeOfMeal';
import { gradeOfNutrition } from '../../src/engine/gradeOfNutrition';
import { nutrientProfileScore } from '../../src/engine/nutrientProfileScore';

/** MM-369, MM-370: the food grade, per 100 g, on twelve steps. */
const lentils = { kcal: 116, proteinG: 9.0, sugarsG: 1.8, saturatedFatG: 0.04, sodiumMg: 2, fiberG: 7.9, alcoholG: undefined };

describe('nutrientProfileScore', () => {
  it('counts the points of a food', () => {
    expect(nutrientProfileScore({ ...lentils, sugarsG: 1.8, saturatedFatG: 0.04, sodiumMg: 2, fiberG: 7.9 })).toEqual({ negative: 1, positive: 8, score: -7 });
  });

  it('stops counting protein at eleven unfavourable points', () => {
    // Energy 2345 kJ → 7 points, sugars 14.5 → 4; fiber 4.5 → 2; protein 17.5 → 7, not counted.
    const score = nutrientProfileScore({ kcal: 561, proteinG: 17.5, sugarsG: 14.5, saturatedFatG: 0, sodiumMg: 0, fiberG: 4.5 });
    expect(score).toEqual({ negative: 11, positive: 2, score: 9 });
  });

  it('is strictly greater than at every threshold', () => {
    expect(nutrientProfileScore({ kcal: 0, proteinG: 0, sugarsG: 0, saturatedFatG: 1.0, sodiumMg: 0, fiberG: 0 }).negative).toBe(0);
    expect(nutrientProfileScore({ kcal: 0, proteinG: 0, sugarsG: 0, saturatedFatG: 1.01, sodiumMg: 0, fiberG: 0 }).negative).toBe(1);
  });

  it('turns sodium into salt', () => {
    expect(nutrientProfileScore({ kcal: 0, proteinG: 0, sugarsG: 0, saturatedFatG: 0, sodiumMg: 490, fiberG: 0 }).negative).toBe(6);
  });
});

describe('gradeLetterOf', () => {
  it('maps the boundaries of the twelve steps', () => {
    const at = [-6, -5, -2, 0, 1, 2, 3, 4, 6, 8, 11, 15, 19].map(gradeLetterOf);
    expect(at).toEqual(['A+', 'A', 'A-', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-']);
    expect(gradeLetterOf(-20)).toBe('A+');
    expect(gradeLetterOf(55)).toBe('D-');
    expect(FoodGradeLetter.values).toHaveLength(12);
  });
});

describe('gradeOfNutrition', () => {
  it('grades a food that states what the method needs', () => {
    expect(gradeOfNutrition(lentils)).toEqual({ kind: 'graded', letter: 'A+', score: -7 });
  });

  it('names what is missing, in order, and never counts it as zero', () => {
    expect(gradeOfNutrition({ ...lentils, sugarsG: undefined, fiberG: undefined })).toEqual({
      kind: 'ungradable',
      reason: 'Can’t be graded: sugars and fiber aren’t stated for this food.',
    });
    expect(gradeOfNutrition({ ...lentils, fiberG: undefined })).toEqual({
      kind: 'ungradable',
      reason: 'Can’t be graded: fiber isn’t stated for this food.',
    });
  });

  it('leaves an alcoholic drink out, and grades one whose alcohol is not stated', () => {
    expect(gradeOfNutrition({ ...lentils, alcoholG: 4 })).toEqual({ kind: 'ungradable', reason: 'Alcoholic drinks aren’t graded.' });
    expect(gradeOfNutrition({ ...lentils, alcoholG: undefined }).kind).toBe('graded');
    expect(gradeOfNutrition({ ...lentils, alcoholG: 1.2 }).kind).toBe('graded');
  });
});

describe('gradeOfMeal', () => {
  const graded = (kcal: number, score: number) => ({ kcal, grade: { kind: 'graded', letter: gradeLetterOf(score), score } as const });
  const unknown = (kcal: number) => ({ kcal, grade: { kind: 'ungradable', reason: 'x' } as const });

  it('weighs the scores by calories and rounds half up', () => {
    // (400 × 2 + 100 × 4) / 500 = 2.4 → 2 → B; (400 × 2 + 400 × 3) / 800 = 2.5 → 3 → B-.
    expect(gradeOfMeal([graded(400, 2), graded(100, 4)], 'meal')).toEqual({ kind: 'graded', letter: 'B', score: 2 });
    expect(gradeOfMeal([graded(400, 2), graded(400, 3)], 'meal')).toEqual({ kind: 'graded', letter: 'B-', score: 3 });
  });

  it('has no grade when too little can be graded, saying the share', () => {
    expect(gradeOfMeal([graded(300, 2), unknown(200)], 'meal')).toEqual({
      kind: 'ungradable',
      reason: 'Only 60% of this meal’s calories come from foods that can be graded, so it has no grade.',
    });
    expect(gradeOfMeal([graded(350, 2), unknown(150)], 'day')?.kind).toBe('graded');
    expect(gradeOfMeal([unknown(150)], 'day')?.kind).toBe('ungradable');
    expect(gradeOfMeal([], 'day')).toBeUndefined();
  });
});

describe('a pack food, a food of one’s own, and a logged entry', () => {
  const pack = (micros: { sugars?: number; saturatedFat?: number }, fiberG: number | undefined = 7.9) =>
    new CatalogFood({
      id: 1,
      packId: 'generic',
      name: 'Lentils, cooked',
      brand: undefined,
      kcal: 116,
      proteinG: 9,
      carbsG: 20,
      fatG: 0.4,
      fiberG,
      sodiumMg: 2,
      alcoholG: undefined,
      micros,
      preparation: 'cooked',
      pairedFoodId: undefined,
      densityGPerMl: undefined,
      source: 'usda_sr_legacy',
      sourceId: '1',
      tier: 'reference',
      tierReason: 'test',
    });

  it('grades a pack food from its values per 100 g', () => {
    expect(gradeOfCatalogFood(pack({ sugars: 1.8, saturatedFat: 0.04 }))).toEqual({ kind: 'graded', letter: 'A+', score: -7 });
    expect(gradeOfCatalogFood(pack({})).kind).toBe('ungradable');
  });

  it('grades a food of one’s own by its serving weight, and never a recipe', () => {
    const bar = new CustomFood({
      id: 1,
      name: 'Protein bar',
      kind: 'food',
      servingDescription: '1 bar',
      servingGrams: 50,
      perServing: new NutritionTotals({ kcal: 200, proteinG: 20, carbsG: 20, fatG: 7 }),
      fiberG: 3,
      micros: new Micronutrients({ sugars: 5, saturatedFat: 2.5, sodium: 150 }),
    });
    // Per 100 g: 400 kcal (1674 kJ → 4), sugars 10 → 2, sat fat 5 → 4, salt 0.75 g → 3: 13; fiber 6 → 3; protein 40 → not counted.
    expect(gradeOfCustomFood(bar)).toEqual({ kind: 'graded', letter: 'C-', score: 10 });
    expect(gradeOfCustomFood(new CustomFood({ ...bar, id: 2, servingGrams: undefined })).kind).toBe('ungradable');
    const recipe = new CustomFood({ id: 3, name: 'Stew', kind: 'recipe', servingDescription: '1 bowl', servings: 4, cookedWeightGrams: 1600, perServing: bar.perServing, ingredients: [] });
    expect(gradeOfCustomFood(recipe)).toMatchObject({ kind: 'ungradable', reason: expect.stringMatching(/^Recipes can’t be graded yet/) });
  });

  it('grades a logged entry per 100 g whatever the amount, and not an estimate or unknown grams', () => {
    const entry = (grams: number) =>
      new FoodEntry({
        id: 1,
        date: CalendarDate.of(2026, 10, 18),
        meal: 'lunch',
        name: 'Lentils',
        kcal: (116 * grams) / 100,
        proteinG: (9 * grams) / 100,
        carbsG: (20 * grams) / 100,
        fatG: (0.4 * grams) / 100,
        fiberG: (7.9 * grams) / 100,
        sodiumMg: (2 * grams) / 100,
        source: 'weighed',
        micros: new Micronutrients({ sugars: (1.8 * grams) / 100, saturatedFat: (0.04 * grams) / 100 }),
        portion: { method: 'weighed', basis: 'calculated', quantity: grams, unit: 'gram', reference: { basis: 'per100g', nutrition: new NutritionTotals({ kcal: 116, proteinG: 9, carbsG: 20, fatG: 0.4 }) } },
      });
    expect(gradeOfFoodEntry(entry(50))).toEqual({ kind: 'graded', letter: 'A+', score: -7 });
    expect(gradeOfFoodEntry(entry(300))).toEqual({ kind: 'graded', letter: 'A+', score: -7 });
    const estimate = new FoodEntry({ id: 2, date: CalendarDate.of(2026, 10, 18), meal: 'lunch', name: 'Soup', kcal: 220, proteinG: 9, carbsG: 30, fatG: 6, source: 'quickAdd' });
    expect(gradeOfFoodEntry(estimate)).toEqual({ kind: 'ungradable', reason: 'Estimated, so not graded.' });
    const typed = new FoodEntry({ id: 3, date: CalendarDate.of(2026, 10, 18), meal: 'lunch', name: 'Curry', kcal: 450, proteinG: 20, carbsG: 40, fatG: 20, source: 'weighed' });
    expect(gradeOfFoodEntry(typed)).toMatchObject({ kind: 'ungradable', reason: expect.stringMatching(/grams isn’t known/) });
  });
});
