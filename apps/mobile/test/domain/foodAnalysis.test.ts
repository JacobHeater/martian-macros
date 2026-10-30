import { describe, expect, it } from 'vitest';
import { customFoodOfDraft } from '../../src/domain/food/custom/customFoodOfDraft';
import type { FoodDraft } from '../../src/domain/food/custom/FoodDraft';
import { foodDraftProblems } from '../../src/domain/food/custom/foodDraftProblems';
import { parseFoodAnalysis } from '../../src/domain/food/custom/parseFoodAnalysis';
import { Micronutrient } from '../../src/domain/food/micros/Micronutrient';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { resolveFoodDrafts } from '../../src/food/ai/resolveFoodDrafts';
import { foodDraftJson } from '../../src/format/foodDraftJson';
import { foodFixMessage } from '../../src/format/foodFixMessage';
import { foodPrompt } from '../../src/format/foodPrompt';
import { cleanFoodAnswer, homemadeFoodAnswer, troubledFoodAnswer } from '../../src/gallery/screens/storyFoodAnswers';
import { fixtureCatalog } from '../support/fixtureCatalog';

/** MM-709: reading an assistant's answer about a food, checking it, and the saved food it becomes. */

const read = (text: string): readonly FoodDraft[] => {
  const reading = parseFoodAnalysis(text);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  return reading.foods;
};

/** Every micronutrient at a plausible amount, so a draft is whole. */
const allMicros = new Micronutrients(Object.fromEntries(Micronutrient.values.map((n) => [n, n === 'sodium' ? 400 : 1])));

const draft = (changes: Partial<FoodDraft> = {}): FoodDraft => ({
  name: 'Buttermilk biscuit',
  brand: 'Homemade',
  lookup: 'biscuit buttermilk',
  group: 'breadsAndGrains',
  servingDescription: '1 biscuit',
  servingGrams: 60,
  kcal: 353,
  proteinG: 6.5,
  carbsG: 44,
  fatG: 16.3,
  fiberG: 1.5,
  sugarAlcoholsG: 0,
  alcoholG: 0,
  micros: allMicros,
  ingredients: [{ name: 'All-purpose flour', grams: 30 }],
  evidence: { kind: 'estimated', citation: 'Estimated from the ingredients' },
  keep: true,
  ...changes,
});

describe('reading an answer', () => {
  it('the prompt’s own example reads back as one food with no problems', () => {
    const [biscuit, ...rest] = read(foodPrompt);
    expect(rest).toEqual([]);
    expect(biscuit?.name).toBe('Buttermilk biscuit');
    expect(biscuit?.brand).toBe('Homemade');
    expect(biscuit?.group).toBe('breadsAndGrains');
    expect(biscuit?.servingDescription).toBe('1 biscuit');
    expect(biscuit?.servingGrams).toBe(60);
    expect(biscuit?.barcode).toBeUndefined();
    expect(biscuit?.ingredients.map((line) => line.name)).toEqual(['All-purpose flour', 'Buttermilk', 'Butter', 'Baking powder']);
    expect(biscuit?.evidence.kind).toBe('estimated');
    expect(foodDraftProblems(biscuit as FoodDraft)).toEqual([]);
  });

  it('finds the code block among the chatter, and reads every field of each food', () => {
    const [bar, yogurt] = read(cleanFoodAnswer);
    expect(bar?.name).toBe('Chocolate protein bar');
    expect(bar?.brand).toBe('Quest');
    expect(bar?.kcal).toBe(317);
    expect(bar?.micros.of('calcium')).toBe(333);
    expect(bar?.sugarAlcoholsG).toBe(2);
    expect(bar?.evidence).toEqual({ kind: 'cited', citation: 'USDA FoodData Central, FDC ID 1844006, Quest Chocolate Chip Cookie Dough Protein Bar' });
    expect(bar?.ingredients).toEqual([]);
    expect(bar?.keep).toBe(true);
    // "Verified" with only a database's name is not a specific source: an estimate, to be looked up.
    expect(yogurt?.brand).toBeUndefined();
    expect(yogurt?.evidence).toEqual({ kind: 'estimated', citation: 'USDA' });
    expect(foodDraftProblems(bar as FoodDraft)).toEqual([]);
    expect(foodDraftProblems(yogurt as FoodDraft)).toEqual([]);
  });

  it('a homemade food keeps what went into it, with the grams given', () => {
    const [biscuit] = read(homemadeFoodAnswer);
    expect(biscuit?.ingredients).toEqual([
      { name: 'All-purpose flour', grams: 30 },
      { name: 'Buttermilk', grams: 22 },
      { name: 'Butter', grams: 10 },
      { name: 'Baking powder', grams: 1 },
    ]);
  });

  it('says why text cannot be read', () => {
    expect(parseFoodAnalysis('Sure, here you go!')).toMatchObject({ kind: 'unreadable', reason: expect.stringMatching(/^There is no food in this text/) });
    expect(parseFoodAnalysis('```json\n{ "format": "martian-macros-food", "foods": [ { "name": "x" ')).toMatchObject({
      kind: 'unreadable',
      reason: expect.stringMatching(/not complete JSON/),
    });
    expect(parseFoodAnalysis('{ "format": "martian-macros-meal", "version": 1, "items": [] }')).toMatchObject({
      kind: 'unreadable',
      reason: 'This answer is in another format (“martian-macros-meal”).',
    });
    expect(parseFoodAnalysis('{ "format": "martian-macros-food", "version": 2, "foods": [ {} ] }')).toMatchObject({
      kind: 'unreadable',
      reason: 'This answer is in version 2 of the format; the app reads version 1.',
    });
    expect(parseFoodAnalysis('{ "name": "x" }')).toMatchObject({ kind: 'unreadable', reason: expect.stringMatching(/no list of foods/) });
    expect(parseFoodAnalysis('{ "format": "martian-macros-food", "version": 1, "foods": [] }')).toMatchObject({ kind: 'unreadable', reason: 'The answer has no foods in it.' });
  });

  it('a food with nothing in it is read as given, and the checks say what it lacks', () => {
    const [empty] = read('{ "foods": [ {} ] }');
    expect(empty?.name).toBe('Food 1');
    const problems = foodDraftProblems(empty as FoodDraft);
    expect(problems).toContain('Missing what one serving is.');
    expect(problems).toContain('Missing the serving’s grams.');
    expect(problems).toContain('Missing its food group.');
    expect(problems.some((p) => p.startsWith('Missing calories, protein, carbohydrate, fat, fiber, sugar alcohols, alcohol, sodium'))).toBe(true);
  });
});

describe('the checks', () => {
  it('a clean draft has no problems', () => {
    expect(foodDraftProblems(draft())).toEqual([]);
  });

  it('a field left out is named: vitamin D', () => {
    expect(foodDraftProblems(draft({ micros: allMicros.with('vitaminD', undefined) }))).toEqual(['Missing vitamin d (per 100 g; 0 when it has none).']);
  });

  it('zero is a number: a food with none of something passes', () => {
    expect(foodDraftProblems(draft({ fiberG: 0, micros: allMicros.with('vitaminC', 0) }))).toEqual([]);
  });

  it('a group not in the app’s list is refused, naming the list', () => {
    const [problem] = foodDraftProblems(draft({ group: 'pastry' }));
    expect(problem).toMatch(/^“pastry” is not one of the app’s food groups \(breakfastCereals, /);
  });

  it('a negative number, an implausible serving, too many calories and too much of a micronutrient are each said', () => {
    expect(foodDraftProblems(draft({ fatG: -1 }))).toContain('Below zero: fat.');
    expect(foodDraftProblems(draft({ servingGrams: 0 }))).toContain('A serving of 0 g is not plausible (more than 0, at most 3,000).');
    expect(foodDraftProblems(draft({ servingGrams: 3001 }))).toContain('A serving of 3001 g is not plausible (more than 0, at most 3,000).');
    expect(foodDraftProblems(draft({ kcal: 950, fatG: 100, carbsG: 0, proteinG: 0 }))).toContain('950 kcal per 100 g is more than any food holds (at most 900).');
    expect(foodDraftProblems(draft({ micros: allMicros.with('vitaminD', 500) }))).toEqual(['More than any food holds per 100 g: vitamin d (at most 300 µg).']);
  });

  it('calories that disagree with the macros are refused (MM-53)', () => {
    expect(foodDraftProblems(draft({ kcal: 100 }))).toEqual(['100 kcal does not agree with the macros (protein and carbohydrate at 4 kcal per gram, fat at 9).']);
  });

  it('the troubled answer: one food missing vitamin D and its group, one whose calories disagree', () => {
    const [pancake, bacon] = read(troubledFoodAnswer);
    expect(foodDraftProblems(pancake as FoodDraft)).toEqual(['Missing its food group.', 'Missing vitamin d (per 100 g; 0 when it has none).']);
    expect(foodDraftProblems(bacon as FoodDraft)).toEqual(['900 kcal does not agree with the macros (protein and carbohydrate at 4 kcal per gram, fat at 9).']);
  });
});

describe('the evidence rule', () => {
  it('cited stays the assistant’s; a vague source is matched in the packs; nothing matched stays an estimate', async () => {
    const catalog = await fixtureCatalog();
    const [bar, yogurt, unknown] = await resolveFoodDrafts(
      [...read(cleanFoodAnswer), draft({ name: 'Martian dust', lookup: 'martian dust', evidence: { kind: 'estimated', citation: 'Guessed' } })],
      catalog,
    );
    expect(bar?.evidence.kind).toBe('cited');
    expect(bar?.kcal).toBe(317);
    // The fixture pack's "Greek yogurt, plain nonfat" is 59 kcal per 100 g: the pack's numbers replace the assistant's, and the line names it.
    expect(yogurt?.evidence).toEqual({ kind: 'matched', citation: 'Greek yogurt, plain nonfat (Food database)' });
    expect(yogurt?.kcal).toBe(59);
    expect(yogurt?.proteinG).toBe(10.2);
    // A number the pack does not state keeps the assistant's, so the food is still whole.
    expect(yogurt?.micros.of('vitaminB12')).toBe(0.8);
    expect(unknown?.evidence).toEqual({ kind: 'estimated', citation: 'Guessed' });
  });

  it('without a catalog every food stays as it was', async () => {
    const foods = read(cleanFoodAnswer);
    expect(await resolveFoodDrafts(foods, undefined)).toEqual(foods);
  });
});

describe('the saved food', () => {
  it('is per serving, derived from the per-100 g numbers, with its group, evidence and ingredients (MM-710)', () => {
    const biscuit = customFoodOfDraft(draft(), 7);
    expect(biscuit.id).toBe(7);
    expect(biscuit.kind).toBe('food');
    expect(biscuit.servingDescription).toBe('1 biscuit');
    expect(biscuit.servingGrams).toBe(60);
    expect(Math.round(biscuit.perServing.kcal)).toBe(212);
    expect(biscuit.perServing.proteinG).toBeCloseTo(3.9, 5);
    expect(biscuit.fiberG).toBeCloseTo(0.9, 5);
    expect(biscuit.micros.of('sodium')).toBeCloseTo(240, 5);
    expect(biscuit.group).toBe('breadsAndGrains');
    expect(biscuit.evidence).toEqual({ kind: 'estimated', citation: 'Estimated from the ingredients' });
    expect(biscuit.madeOf).toEqual([{ name: 'All-purpose flour', grams: 30 }]);
    expect(biscuit.barcode).toBeUndefined();
  });

  it('carries the barcode the draft was given', () => {
    expect(customFoodOfDraft(draft({ barcode: '00012345678905' })).barcode).toBe('00012345678905');
  });
});

describe('back to the assistant', () => {
  it('the JSON of the foods as they stand reads back the same', () => {
    const foods = read(cleanFoodAnswer);
    const again = read(foodDraftJson(foods));
    expect(again.map((f) => [f.name, f.brand, f.group, f.servingGrams, f.kcal, f.micros.of('folate'), f.evidence.kind])).toEqual(
      foods.map((f) => [f.name, f.brand, f.group, f.servingGrams, f.kcal, f.micros.of('folate'), f.evidence.kind]),
    );
    expect(foodDraftProblems(again[0] as FoodDraft)).toEqual([]);
  });

  it('the fix message names each problem under its food and carries the foods as they stand', () => {
    const [pancake, bacon] = read(troubledFoodAnswer);
    const message = foodFixMessage([{ ...(pancake as FoodDraft), servingGrams: 90 }, bacon as FoodDraft]);
    expect(message).toContain('- Food 1, "Pancake": Missing its food group. Missing vitamin d (per 100 g; 0 when it has none).');
    expect(message).toContain('- Food 2, "Bacon": 900 kcal does not agree with the macros');
    expect(message).toContain('"grams": 90');
    expect(message).toContain('"format": "martian-macros-food"');
    expect(message).toMatch(/answer with every food again in the same format/);
  });
});
