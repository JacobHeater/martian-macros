import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { FoodGradeLetter } from '../../src/domain/food/grade/FoodGradeLetter';
import { friedByName } from '../../src/domain/food/grade/friedByName';
import { Micronutrient } from '../../src/domain/food/micros/Micronutrient';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { referenceAmount } from '../../src/domain/food/micros/referenceAmount';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { FoodGradeRule } from '../../src/engine/FoodGradeRule';
import { GradeMicronutrient } from '../../src/engine/GradeMicronutrient';
import { gradeLetterOf } from '../../src/engine/gradeLetterOf';
import { gradeOfCatalogFood } from '../../src/food/gradeOfCatalogFood';
import { gradeOfCustomFood } from '../../src/engine/gradeOfCustomFood';
import { gradeOfFoodEntry } from '../../src/engine/gradeOfFoodEntry';
import { gradeOfMeal } from '../../src/engine/gradeOfMeal';
import { gradeOfNutrition } from '../../src/engine/gradeOfNutrition';
import type { GradeNutrition } from '../../src/engine/GradeNutrition';
import { nutrientDensityScore } from '../../src/engine/nutrientDensityScore';
import type { NutrientDensityInput } from '../../src/engine/NutrientDensityInput';
import { gradeCalibrationFoods } from '../support/gradeCalibrationFoods';

/** MM-380, MM-382: the food grade, the app's own, from what a food gives per calorie, on twelve steps. */
const lentils: GradeNutrition = {
  kcal: 116,
  proteinG: 9,
  carbsG: 20,
  fiberG: 7.9,
  sodiumMg: 2,
  sugarsG: 1.8,
  saturatedFatG: 0.05,
  alcoholG: undefined,
  micros: { potassium: 369, calcium: 19, iron: 3.3, magnesium: 36, zinc: 1.3, vitaminA: 0, vitaminC: 1.5, vitaminD: 0, vitaminB12: 0, folate: 181 },
};
const known = (per100g: GradeNutrition): NutrientDensityInput => ({ ...per100g, fiberG: per100g.fiberG as number, sodiumMg: per100g.sodiumMg as number });
const plain = (over: Partial<NutrientDensityInput>): NutrientDensityInput => ({ kcal: 100, proteinG: 0, fiberG: 0, sodiumMg: 0, sugarsG: 0, saturatedFatG: 0, micros: {}, ...over });
const step = (letter: FoodGradeLetter) => FoodGradeLetter.values.indexOf(letter);

describe('the calibration set (the panel’s ME-1, NU-5)', () => {
  it.each(gradeCalibrationFoods.map((f) => [f.name, f] as const))('%s', (_, food) => {
    const grade = gradeOfNutrition(food.per100g);
    if (food.letter === undefined) expect(grade.kind).toBe('ungradable');
    else expect(grade).toMatchObject({ kind: 'graded', letter: food.letter });
  });

  it('holds at least two foods on every step', () => {
    for (const letter of FoodGradeLetter.values) {
      expect(gradeCalibrationFoods.filter((f) => f.letter === letter).length, letter).toBeGreaterThanOrEqual(2);
    }
  });

  it('moves a food at most one step for 5% on its calories and two for 20% (ME-2)', () => {
    for (const food of gradeCalibrationFoods) {
      if (food.letter === undefined) continue;
      for (const [factor, steps] of [[0.95, 1], [1.05, 1], [0.8, 2], [1.2, 2]] as const) {
        if (food.per100g.kcal * factor < FoodGradeRule.minKcalPer100g) continue;
        const moved = gradeOfNutrition({ ...food.per100g, kcal: food.per100g.kcal * factor });
        expect(moved.kind, food.name).toBe('graded');
        if (moved.kind === 'graded') expect(Math.abs(step(moved.letter) - step(food.letter)), `${food.name} × ${factor}`).toBeLessThanOrEqual(steps);
      }
    }
  });

  it('keeps a food and its cooked state within a step (NU-1)', () => {
    const letterOf = (name: string) => {
      const food = gradeCalibrationFoods.find((f) => f.name === name);
      return step(food?.letter ?? 'D-');
    };
    expect(Math.abs(letterOf('Oats, dry') - letterOf('Oats, cooked in water'))).toBeLessThanOrEqual(1);
    expect(letterOf('Skim milk')).toBeLessThanOrEqual(letterOf('Milk, 2%'));
    expect(letterOf('Milk, 2%')).toBeLessThanOrEqual(letterOf('Whole milk'));
    expect(letterOf('Whole milk') - letterOf('Skim milk')).toBeLessThanOrEqual(3);
    expect(letterOf('Grapes')).toBeLessThanOrEqual(step('C+'));
    expect(letterOf('Pickles, dill')).toBeGreaterThan(letterOf('Egg, hard-boiled'));
  });
});

describe('nutrientDensityScore', () => {
  it('counts what a food gives per 100 kcal', () => {
    // Per 100 kcal: protein 7.8 → 4, fiber 6.8 → 7, sodium 1.7 → 0, sugars waived (fiber), sat fat 0.04 → 0; 1.16 kcal/g → 0.
    const score = nutrientDensityScore(known(lentils));
    expect(score.points).toMatchObject({ protein: 4, fiber: 7, energyDensity: 0, sodium: 0, sugars: 0, saturatedFat: 0 });
    expect(score.sugarsKept).toBe(0);
    expect(score.micronutrientsPercent).toBeCloseTo(8.2, 0);
    expect(score.points.micronutrients).toBe(3);
    expect(score.statedMicronutrients).toBe(10);
    expect(score.score).toBe(14);
    expect(score.notCounted).toEqual([]);
  });

  it('reaches a threshold for a food and passes one against it (ME-7)', () => {
    for (const t of FoodGradeRule.proteinGPer100Kcal) {
      expect(nutrientDensityScore(plain({ proteinG: t })).points.protein, `${t}`).toBe(nutrientDensityScore(plain({ proteinG: t + 0.001 })).points.protein);
      expect(nutrientDensityScore(plain({ proteinG: t - 0.001 })).points.protein, `${t}`).toBe(nutrientDensityScore(plain({ proteinG: t })).points.protein - 1);
    }
    for (const t of FoodGradeRule.fiberGPer100Kcal) {
      expect(nutrientDensityScore(plain({ fiberG: t })).points.fiber).toBe(nutrientDensityScore(plain({ fiberG: t - 0.001 })).points.fiber + 1);
    }
    for (const t of FoodGradeRule.sodiumMgPer100Kcal) {
      expect(nutrientDensityScore(plain({ sodiumMg: t })).points.sodium, `${t}`).toBe(nutrientDensityScore(plain({ sodiumMg: t - 0.001 })).points.sodium);
      expect(nutrientDensityScore(plain({ sodiumMg: t + 0.001 })).points.sodium, `${t}`).toBe(nutrientDensityScore(plain({ sodiumMg: t })).points.sodium + 1);
    }
    for (const t of FoodGradeRule.saturatedFatGPer100Kcal) {
      expect(nutrientDensityScore(plain({ saturatedFatG: t })).points.saturatedFat).toBe(nutrientDensityScore(plain({ saturatedFatG: t + 0.001 })).points.saturatedFat - 1);
    }
    for (const t of FoodGradeRule.sugarsGPer100Kcal) {
      expect(nutrientDensityScore(plain({ kcal: 300, sugarsG: 3 * t })).points.sugars).toBe(nutrientDensityScore(plain({ kcal: 300, sugarsG: 3 * t + 0.003 })).points.sugars - 1);
    }
    for (const t of FoodGradeRule.kcalPerGram) {
      expect(nutrientDensityScore(plain({ kcal: t * 100 })).points.energyDensity).toBe(nutrientDensityScore(plain({ kcal: t * 100 + 0.1 })).points.energyDensity - 1);
    }
  });

  it('never lowers the score for more of what counts for a food, nor raises it for more of what counts against', () => {
    const base = plain({ kcal: 150, proteinG: 6, fiberG: 2, sodiumMg: 200, sugarsG: 8, saturatedFatG: 2, micros: { potassium: 300, calcium: 100, iron: 2, magnesium: 30, zinc: 1 } });
    const scoreOf = (over: Partial<NutrientDensityInput>) => nutrientDensityScore({ ...base, ...over }).score;
    for (let i = 0; i <= 40; i++) {
      expect(scoreOf({ proteinG: 6 + i })).toBeGreaterThanOrEqual(scoreOf({ proteinG: 6 + i - 1 }));
      expect(scoreOf({ fiberG: 2 + i * 0.5 })).toBeGreaterThanOrEqual(scoreOf({ fiberG: 2 + (i - 1) * 0.5 }));
      expect(scoreOf({ micros: { ...base.micros, iron: 2 + i } })).toBeGreaterThanOrEqual(scoreOf({ micros: { ...base.micros, iron: 2 + i - 1 } }));
      expect(scoreOf({ sodiumMg: 200 + i * 200 })).toBeLessThanOrEqual(scoreOf({ sodiumMg: 200 + (i - 1) * 200 }));
      expect(scoreOf({ sugarsG: 8 + i })).toBeLessThanOrEqual(scoreOf({ sugarsG: 8 + i - 1 }));
      expect(scoreOf({ saturatedFatG: 2 + i })).toBeLessThanOrEqual(scoreOf({ saturatedFatG: 2 + i - 1 }));
    }
  });

  it('is the same for a food and the food diluted with water, but for calories per gram (ME-5)', () => {
    for (const factor of [0.9, 0.5, 0.25]) {
      const diluted = known({
        ...lentils,
        kcal: lentils.kcal * factor,
        proteinG: lentils.proteinG * factor,
        fiberG: (lentils.fiberG as number) * factor,
        sodiumMg: (lentils.sodiumMg as number) * factor,
        sugarsG: (lentils.sugarsG as number) * factor,
        saturatedFatG: (lentils.saturatedFatG as number) * factor,
        micros: Object.fromEntries(Object.entries(lentils.micros).map(([k, v]) => [k, (v as number) * factor])),
      });
      const a = nutrientDensityScore(known(lentils));
      const b = nutrientDensityScore(diluted);
      expect(b.points).toMatchObject({ protein: a.points.protein, fiber: a.points.fiber, micronutrients: a.points.micronutrients, sodium: a.points.sodium, sugars: a.points.sugars });
      expect(b.points.energyDensity).toBeLessThanOrEqual(a.points.energyDensity);
      expect(b.score).toBeGreaterThanOrEqual(a.score);
    }
  });

  it('reads what counts against a watery food per 40 kcal, and what counts for it per 100 kcal (ME-3)', () => {
    // A 12 kcal broth with 250 mg sodium: per 100 kcal it would be 2,083 mg (10 points); per 40 kcal it is 625 (5).
    const broth = nutrientDensityScore(plain({ kcal: 12, proteinG: 0.6, sodiumMg: 250 }));
    expect(broth.points.sodium).toBe(5);
    expect(broth.points.protein).toBe(3); // 0.6 g at 12 kcal is 5 g per 100 kcal.
    expect(nutrientDensityScore(plain({ kcal: 40, sodiumMg: 250 })).points.sodium).toBe(5);
    expect(nutrientDensityScore(plain({ kcal: 50, sodiumMg: 250 })).points.sodium).toBe(4);
  });

  it('waives sugars for a watery food by its fiber or protein, on a ramp (NU-2, ME-4)', () => {
    const cola = nutrientDensityScore(plain({ kcal: 37, sugarsG: 9 }));
    expect(cola.points.sugars).toBe(6); // 22.5 g per 40 kcal
    expect(cola.sugarsKept).toBe(1);
    // Whole milk: protein 5.2 g per 100 kcal, past the ramp's top; nothing kept.
    expect(nutrientDensityScore(plain({ kcal: 61, proteinG: 3.2, sugarsG: 5.1 })).sugarsKept).toBe(0);
    // Halfway up the protein ramp (3.375 g per 100 kcal): half kept.
    expect(nutrientDensityScore(plain({ kcal: 100, proteinG: 3.375, sugarsG: 10 })).sugarsKept).toBeCloseTo(0.5);
    expect(nutrientDensityScore(plain({ kcal: 100, proteinG: 2.25, sugarsG: 10 })).sugarsKept).toBe(1);
    // Fiber 1 g per 100 kcal waives alone; 0.5 g does nothing.
    expect(nutrientDensityScore(plain({ kcal: 100, fiberG: 1, sugarsG: 10 })).sugarsKept).toBe(0);
    expect(nutrientDensityScore(plain({ kcal: 100, fiberG: 0.5, sugarsG: 10 })).sugarsKept).toBe(1);
    // A sweetened cereal with added fiber at 3.75 kcal per g gets no waiver; at 1.75 kcal per g, half of one.
    expect(nutrientDensityScore(plain({ kcal: 375, fiberG: 10, sugarsG: 37 })).sugarsKept).toBe(1);
    expect(nutrientDensityScore(plain({ kcal: 175, fiberG: 10, sugarsG: 20 })).sugarsKept).toBeCloseTo(0.5);
    expect(nutrientDensityScore(plain({ kcal: 150, fiberG: 10, sugarsG: 20 })).sugarsKept).toBe(0);
  });

  it('counts the vitamins and minerals from four stated, over the stated, bounded by breadth (MN-1, MN-2, MN-3)', () => {
    const juice = { kcal: 45, proteinG: 0.7, fiberG: 0.2, sodiumMg: 1, sugarsG: 8.4, saturatedFatG: 0.02 };
    const ten = nutrientDensityScore({ ...juice, micros: { potassium: 200, calcium: 11, iron: 0.2, magnesium: 11, zinc: 0.05, vitaminA: 10, vitaminC: 50, vitaminD: 0, vitaminB12: 0, folate: 30 } });
    const label = nutrientDensityScore({ ...juice, micros: { potassium: 200, calcium: 11, iron: 0.2, vitaminD: 0 } });
    const labelWithC = nutrientDensityScore({ ...juice, micros: { potassium: 200, calcium: 11, iron: 0.2, vitaminD: 0, vitaminC: 50 } });
    const three = nutrientDensityScore({ ...juice, micros: { potassium: 200, calcium: 11, iron: 0.2 } });
    expect(ten.points.micronutrients).toBe(3); // The mean (14%) reaches 4; the sugars cap holds it to 3.
    expect(label.statedMicronutrients).toBe(4);
    expect(label.notCounted).toEqual([]);
    expect(label.points.micronutrients).toBe(1); // Mean 3.5% over the four stated: potassium alone reaches 5%.
    expect(labelWithC.micronutrientsPercent).toBeCloseTo(22.8, 0);
    expect(labelWithC.points.micronutrients).toBe(2); // Six by the mean; breadth two (potassium, vitamin C); never more than the full profile.
    expect(three.notCounted).toEqual(['micronutrients']);
    expect(three.statedMicronutrients).toBe(3);
    expect(three.micronutrientsPercent).toBeUndefined();
  });

  it('caps one nutrient at its whole Daily Value per 100 kcal', () => {
    // Vitamin C 89 mg per 34 kcal is 290% of the Daily Value per 100 kcal; capped at 100, the mean over the five stated is 31.3.
    const broccoli = nutrientDensityScore(plain({ kcal: 34, proteinG: 2.8, fiberG: 2.6, sodiumMg: 33, sugarsG: 1.7, saturatedFatG: 0.04, micros: { potassium: 316, calcium: 47, iron: 0.7, magnesium: 21, vitaminC: 89 } }));
    expect(broccoli.micronutrientsPercent).toBeCloseTo(31.3, 0);
  });

  it('holds a sweetened food’s vitamins and minerals to three points (NU-9)', () => {
    const fortified = { potassium: 150, calcium: 15, iron: 27, magnesium: 35, zinc: 11.5, vitaminA: 490, vitaminC: 38, vitaminD: 6.4, vitaminB12: 4.4, folate: 620 };
    expect(nutrientDensityScore(plain({ kcal: 375, proteinG: 6, fiberG: 10, sodiumMg: 400, sugarsG: 37, micros: fortified })).points.micronutrients).toBe(3);
    expect(nutrientDensityScore(plain({ kcal: 375, proteinG: 6, fiberG: 10, sodiumMg: 400, sugarsG: 4, micros: fortified })).points.micronutrients).toBe(5);
  });

  it('leaves out what is not stated, in the order the popover names it', () => {
    const score = nutrientDensityScore(plain({ proteinG: 5, fiberG: 1, sodiumMg: 50, sugarsG: undefined, saturatedFatG: undefined }));
    expect(score.notCounted).toEqual(['sugars', 'saturatedFat', 'micronutrients']);
    expect(score.sugarsKept).toBeUndefined();
  });

  it('counts exactly the tracked nutrients that have a reference amount', () => {
    const withReference = Micronutrient.values.filter((n) => referenceAmount(n, { sex: 'male', age: 30 }) !== undefined);
    expect([...GradeMicronutrient.values]).toEqual(withReference);
    expect(Object.keys(FoodGradeRule.dailyValues).sort()).toEqual([...GradeMicronutrient.values].sort());
  });
});

describe('gradeLetterOf', () => {
  it('maps the floors of the twelve steps, and the point below each', () => {
    const floors = FoodGradeRule.letterSteps;
    expect(floors).toHaveLength(11);
    floors.forEach((floor, i) => {
      expect(gradeLetterOf(floor), `${floor}`).toBe(FoodGradeLetter.values[i]);
      expect(gradeLetterOf(floor - 1), `${floor - 1}`).toBe(FoodGradeLetter.values[i + 1]);
    });
    expect(gradeLetterOf(40)).toBe('A+');
    expect(gradeLetterOf(-30)).toBe('D-');
    expect(FoodGradeLetter.values).toHaveLength(12);
  });
});

describe('gradeOfNutrition', () => {
  it('grades a food that states what the method requires', () => {
    expect(gradeOfNutrition(lentils)).toEqual({ kind: 'graded', letter: 'A', score: 14, notCounted: [], statedMicronutrients: 10 });
  });

  it('names a missing sodium and never counts it as zero', () => {
    expect(gradeOfNutrition({ ...lentils, carbsG: undefined, fiberG: undefined, sodiumMg: undefined })).toEqual({
      kind: 'ungradable',
      reason: 'Sodium isn’t stated for this food, so it can’t be graded.',
    });
    expect(gradeOfNutrition({ ...lentils, sodiumMg: undefined })).toEqual({
      kind: 'ungradable',
      reason: 'Sodium isn’t stated for this food, so it can’t be graded.',
    });
  });

  // MM-567: grated parmesan said "fiber isn't stated"; MM-656 (the owner): a soda with no fiber or sugars stated had no grade.
  it('grades a food whose fiber is not stated as having none, and says so', () => {
    const parmesan: GradeNutrition = {
      kcal: 392,
      proteinG: 36,
      carbsG: 3.2,
      fiberG: undefined,
      sodiumMg: 1600,
      sugarsG: 0.8,
      saturatedFatG: 16,
      alcoholG: undefined,
      micros: {},
    };
    const graded = gradeOfNutrition(parmesan);
    expect(graded).toMatchObject({ kind: 'graded', notCounted: ['fiber', 'micronutrients'] });
    expect(graded).toEqual({ ...gradeOfNutrition({ ...parmesan, fiberG: 0 }), notCounted: ['fiber', 'micronutrients'] });
    expect(gradeOfNutrition({ ...parmesan, carbsG: 0, sugarsG: undefined })).toMatchObject({ kind: 'graded' });
    // Where the carbs could hold fiber, the food is still graded as having none: a step too low at worst, never too high.
    const unstated = gradeOfNutrition({ ...lentils, fiberG: undefined });
    expect(unstated).toEqual({ ...gradeOfNutrition({ ...lentils, fiberG: 0 }), notCounted: ['fiber'] });
    expect(unstated).toMatchObject({ kind: 'graded' });
    expect(step((unstated as { letter: FoodGradeLetter }).letter)).toBeGreaterThan(step('A'));
    // A soda with no fiber or sugars stated (MM-656): graded, as all carbs and no fiber.
    const soda: GradeNutrition = { kcal: 54, proteinG: 0, carbsG: 14.4, fiberG: undefined, sodiumMg: 15, sugarsG: undefined, saturatedFatG: undefined, alcoholG: undefined, micros: {} };
    expect(gradeOfNutrition(soda)).toMatchObject({ kind: 'graded', notCounted: ['fiber', 'sugars', 'saturatedFat', 'micronutrients'] });
  });

  it('grades a food without sugars, saturated fat or micronutrients, and says so', () => {
    expect(gradeOfNutrition({ ...lentils, sugarsG: undefined, saturatedFatG: undefined, micros: {} })).toEqual({
      kind: 'graded',
      letter: 'A-',
      score: 11,
      notCounted: ['sugars', 'saturatedFat', 'micronutrients'],
      statedMicronutrients: 0,
    });
  });

  it('has nothing to grade in a food with almost no calories', () => {
    expect(gradeOfNutrition({ ...lentils, kcal: 9.99 })).toEqual({ kind: 'ungradable', reason: 'Almost no calories, so there’s nothing to grade per calorie.' });
    expect(gradeOfNutrition({ ...lentils, kcal: 10 }).kind).toBe('graded');
  });

  it('leaves an alcoholic drink out, and grades one whose alcohol is not stated', () => {
    expect(gradeOfNutrition({ ...lentils, alcoholG: 4 })).toEqual({ kind: 'ungradable', reason: 'Alcoholic drinks aren’t graded.' });
    expect(gradeOfNutrition({ ...lentils, alcoholG: undefined }).kind).toBe('graded');
    expect(gradeOfNutrition({ ...lentils, alcoholG: 1.2 }).kind).toBe('graded');
  });
});

describe('the cap (MM-660)', () => {
  // The pack's own numbers per 100 g (FNDDS, 2026-10-27).
  const generalTso: GradeNutrition = { kcal: 295, proteinG: 12.9, fatG: 16.4, carbsG: 24, fiberG: 0.9, sodiumMg: 435, sugarsG: 11.6, saturatedFatG: 2.76, alcoholG: undefined, micros: { potassium: 201, calcium: 12, iron: 1.16, magnesium: 18, zinc: 1.3, vitaminA: 11, vitaminC: 1.6, vitaminD: 0.2, vitaminB12: 0.22, folate: 15 } };
  const friedBreast: GradeNutrition = { kcal: 243, proteinG: 24.6, fatG: 14, carbsG: 7.8, fiberG: 0.3, sodiumMg: 500, sugarsG: 0.3, saturatedFatG: 3.6, alcoholG: undefined, micros: {} };
  const peanutButter: GradeNutrition = { kcal: 588, proteinG: 25, fatG: 50, carbsG: 20, fiberG: 6, sodiumMg: 429, sugarsG: 10.5, saturatedFatG: 10, alcoholG: undefined, micros: { potassium: 649, magnesium: 168, zinc: 2.9, folate: 87 } };

  it('reads fried, battered and breaded from a name, and not a stir-fry, a pan-fry, an egg or a coating not eaten', () => {
    for (const name of ['Chicken breast, fried, coated, skin / coating eaten', 'Doughnut, cake type, plain', 'Potato chips, plain', 'French fries, from fast food', 'Soybean curd, deep fried', 'Onion rings, breaded', 'Mozzarella sticks, breaded, baked, or fried'])
      expect(friedByName(name), name).toBe(true);
    for (const name of ['Vegetables, stir-fried', 'Veal, pan-fried, not breaded', 'Beef, cooked, fast fried', 'Refried beans', 'Egg, whole, fried', 'Egg white omelet, scrambled, or fried', 'Roll, not fried', 'Chicken breast, fried, coated, skin / coating not eaten', 'Chicken breast, grilled', 'General Tso chicken'])
      expect(friedByName(name), name).toBe(false);
  });

  it('holds a fried food to C- whatever its score, and says why', () => {
    const free = gradeOfNutrition(friedBreast, { name: 'Chicken breast, grilled' });
    expect(free).toMatchObject({ kind: 'graded', letter: 'B-' });
    expect(free).not.toHaveProperty('cap');
    expect(gradeOfNutrition(friedBreast, { name: 'Chicken breast, fried, coated, skin / coating eaten' })).toMatchObject({ kind: 'graded', letter: 'C-', score: -2, cap: 'fried' });
    // Already below the cap: the letter stays, the reason is still given.
    expect(gradeOfNutrition({ ...lentils, kcal: 434, proteinG: 5, fatG: 25, sodiumMg: 400, sugarsG: 23, saturatedFatG: 11, fiberG: 1.6 }, { name: 'Doughnut, cake type, plain' })).toMatchObject({ cap: 'fried' });
  });

  it('holds a sweet and fatty food with little for it to C-, and never a nut butter', () => {
    expect(gradeOfNutrition(generalTso)).toMatchObject({ kind: 'graded', letter: 'C' });
    expect(gradeOfNutrition(generalTso, { name: 'General Tso chicken' })).toMatchObject({ kind: 'graded', letter: 'C-', score: -2, cap: 'sweetAndFatty' });
    expect(gradeOfNutrition(peanutButter, { name: 'Peanut butter, smooth style, with salt' })).not.toHaveProperty('cap');
    // Without fat or sugars stated, the numbers cannot cap a food.
    expect(gradeOfNutrition({ ...generalTso, fatG: undefined }, { name: 'General Tso chicken' })).not.toHaveProperty('cap');
    expect(gradeOfNutrition({ ...generalTso, sugarsG: undefined }, { name: 'General Tso chicken' })).not.toHaveProperty('cap');
  });
});

describe('gradeOfMeal', () => {
  const graded = (kcal: number, score: number) => ({ kcal, grade: { kind: 'graded', letter: gradeLetterOf(score), score, notCounted: [], statedMicronutrients: 10 } as const });
  const unknown = (kcal: number) => ({ kcal, grade: { kind: 'ungradable', reason: 'x' } as const });
  const meal = (score: number) => ({ kind: 'graded', letter: gradeLetterOf(score), score, notCounted: [], statedMicronutrients: 0 });

  it('weighs the scores by calories and rounds half up (ME-9)', () => {
    // (400 × 6 + 100 × 2) / 500 = 5.2 → 5 → B; (400 × 6 + 400 × 5) / 800 = 5.5 → 6 → B.
    expect(gradeOfMeal([graded(400, 6), graded(100, 2)], 'meal')).toEqual(meal(5));
    expect(gradeOfMeal([graded(400, 6), graded(400, 5)], 'meal')).toEqual(meal(6));
    // (300 × −4 + 100 × −1) / 400 = −3.25 → −3 → C-; −2.5 → −2 → C; −0.5 → 0 → C.
    expect(gradeOfMeal([graded(300, -4), graded(100, -1)], 'day')).toEqual(meal(-3));
    expect(gradeOfMeal([graded(100, -3), graded(100, -2)], 'day')).toEqual(meal(-2));
    expect(gradeOfMeal([graded(100, -1), graded(100, 0)], 'day')).toEqual(meal(0));
  });

  it('has no grade when too little can be graded, saying the share', () => {
    expect(gradeOfMeal([graded(300, 6), unknown(200)], 'meal')).toMatchObject({ kind: 'ungradable', reason: 'Only 60% of this meal’s calories come from foods that can be graded, so it has no grade.' });
    expect(gradeOfMeal([graded(350, 6), unknown(150)], 'meal')).toMatchObject({ kind: 'graded', letter: 'B' });
    expect(gradeOfMeal([unknown(150)], 'day')).toMatchObject({ kind: 'ungradable', reason: 'None of this day’s calories come from foods that can be graded.' });
    expect(gradeOfMeal([], 'day')).toBeUndefined();
  });

  it('is barely dented by a coffee and a beer that can’t be graded (ME-11)', () => {
    expect(gradeOfMeal([graded(1800, 5), unknown(5), unknown(300)], 'day')).toMatchObject({ kind: 'graded', letter: 'B' });
    expect(gradeOfMeal([graded(1800, 5), unknown(5), unknown(300), unknown(600)], 'day')).toMatchObject({ kind: 'ungradable' });
  });
});

describe('a pack food, a food of one’s own, and a logged entry', () => {
  const pack = (micros: Partial<Record<GradeMicronutrient | 'sugars' | 'saturatedFat', number>>, { fiberG }: { fiberG: number | undefined } = { fiberG: 7.9 }) =>
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

  it('grades a pack food from its values per 100 g, counting what it states', () => {
    expect(gradeOfCatalogFood(pack({}))).toEqual({ kind: 'graded', letter: 'A-', score: 11, notCounted: ['sugars', 'saturatedFat', 'micronutrients'], statedMicronutrients: 0 });
    expect(gradeOfCatalogFood(pack({ sugars: 1.8, saturatedFat: 0.05, potassium: 369, calcium: 19, iron: 3.3, magnesium: 36, zinc: 1.3, folate: 181 }))).toMatchObject({ kind: 'graded', notCounted: [], statedMicronutrients: 6 });
    expect(gradeOfCatalogFood(pack({}, { fiberG: undefined }))).toMatchObject({ kind: 'graded', notCounted: ['fiber', 'sugars', 'saturatedFat', 'micronutrients'] });
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
    // Per 100 kcal: protein 10 → 6, fiber 1.5 → 2, sodium 75 → 0, sugars waived (protein), sat fat 1.25 → 0; 4 kcal/g → 1.
    expect(gradeOfCustomFood(bar)).toEqual({ kind: 'graded', letter: 'B+', score: 7, notCounted: ['micronutrients'], statedMicronutrients: 0 });
    expect(gradeOfCustomFood(new CustomFood({ ...bar, id: 2, servingGrams: undefined })).kind).toBe('ungradable');
    expect(gradeOfCustomFood(new CustomFood({ ...bar, id: 4, micros: new Micronutrients({ sodium: 150 }) }))).toMatchObject({ notCounted: ['sugars', 'saturatedFat', 'micronutrients'] });
    expect(gradeOfCustomFood(new CustomFood({ ...bar, id: 5, micros: new Micronutrients({}) }))).toMatchObject({ kind: 'ungradable', reason: 'Sodium isn’t stated for this food, so it can’t be graded.' });
    const recipe = new CustomFood({ id: 3, name: 'Stew', kind: 'recipe', servingDescription: '1 bowl', servings: 4, cookedWeightGrams: 1600, perServing: bar.perServing, ingredients: [] });
    expect(gradeOfCustomFood(recipe)).toMatchObject({ kind: 'ungradable', reason: 'Recipes can’t be graded yet: their ingredients don’t carry fiber or sodium.' });
  });

  it('grades a logged entry whatever the amount, and not an estimate or unknown grams', () => {
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
        micros: new Micronutrients({ sugars: (1.8 * grams) / 100, saturatedFat: (0.05 * grams) / 100, potassium: (369 * grams) / 100, calcium: (19 * grams) / 100, iron: (3.3 * grams) / 100, folate: (181 * grams) / 100 }),
        portion: { method: 'weighed', basis: 'calculated', quantity: grams, unit: 'gram', reference: { basis: 'per100g', nutrition: new NutritionTotals({ kcal: 116, proteinG: 9, carbsG: 20, fatG: 0.4 }) } },
      });
    expect(gradeOfFoodEntry(entry(50))).toEqual({ kind: 'graded', letter: 'A', score: 14, notCounted: [], statedMicronutrients: 4 });
    expect(gradeOfFoodEntry(entry(300))).toEqual({ kind: 'graded', letter: 'A', score: 14, notCounted: [], statedMicronutrients: 4 });
    const estimate = new FoodEntry({ id: 2, date: CalendarDate.of(2026, 10, 18), meal: 'lunch', name: 'Soup', kcal: 220, proteinG: 9, carbsG: 30, fatG: 6, source: 'quickAdd' });
    expect(gradeOfFoodEntry(estimate)).toEqual({ kind: 'ungradable', reason: 'Estimated, so not graded.' });
    const typed = new FoodEntry({ id: 3, date: CalendarDate.of(2026, 10, 18), meal: 'lunch', name: 'Curry', kcal: 450, proteinG: 20, carbsG: 40, fatG: 20, source: 'weighed' });
    expect(gradeOfFoodEntry(typed)).toMatchObject({ kind: 'ungradable', reason: 'The amount in grams or millilitres isn’t known, so the food can’t be graded.' });
  });

  it('MM-654: grades a drink logged by volume per 100 mL, as the pack grades it, with no density', () => {
    // An orange soda stated per 100 mL: 54 kcal, 14.4 g of sugars, 15 mg of sodium, no fiber stated; 4 fl oz of it.
    const ml = 4 * 29.5735295625;
    const f = ml / 100;
    const soda = new FoodEntry({
      id: 4,
      date: CalendarDate.of(2026, 10, 27),
      meal: 'lunch',
      name: 'Orange soda',
      kcal: 54 * f,
      proteinG: 0,
      carbsG: 14.4 * f,
      fatG: 0,
      sodiumMg: 15 * f,
      source: 'householdMeasure',
      micros: new Micronutrients({ sugars: 14.4 * f }),
      portion: {
        method: 'householdMeasure',
        basis: 'calculated',
        quantity: 4,
        unit: 'fluidOunce',
        reference: { basis: 'per100ml', nutrition: new NutritionTotals({ kcal: 54, proteinG: 0, carbsG: 14.4, fatG: 0 }) },
      },
    });
    const per100ml = gradeOfNutrition({ kcal: 54, proteinG: 0, carbsG: 14.4, fiberG: undefined, sodiumMg: 15, sugarsG: 14.4, saturatedFatG: undefined, alcoholG: undefined, micros: {} });
    expect(per100ml).toMatchObject({ kind: 'graded', letter: 'D' });
    expect(gradeOfFoodEntry(soda)).toEqual(per100ml);
  });
});
