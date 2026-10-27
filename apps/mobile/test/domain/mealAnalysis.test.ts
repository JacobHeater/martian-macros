import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { entryOfMealItem } from '../../src/domain/food/meal/entryOfMealItem';
import { foodLogRows } from '../../src/domain/food/meal/foodLogRows';
import { isSpecificCitation } from '../../src/domain/food/meal/isSpecificCitation';
import { LoggedMeal } from '../../src/domain/food/meal/LoggedMeal';
import type { MealDraft } from '../../src/domain/food/meal/MealDraft';
import type { MealItemDraft } from '../../src/domain/food/meal/MealItemDraft';
import { mealItemOfEntry } from '../../src/domain/food/meal/mealItemOfEntry';
import { mealItemProblems } from '../../src/domain/food/meal/mealItemProblems';
import { mealItemWithGrams } from '../../src/domain/food/meal/mealItemWithGrams';
import { eatenWhenIn } from '../../src/domain/food/meal/eatenWhenIn';
import { minuteOfDayIn } from '../../src/domain/food/meal/minuteOfDayIn';
import { parseMealAnalysis } from '../../src/domain/food/meal/parseMealAnalysis';
import { recentMealsIn } from '../../src/domain/food/meal/recentMealsIn';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { intakeDayFrom } from '../../src/domain/intakeDayFrom';
import { gradeOfFoodEntry } from '../../src/engine/gradeOfFoodEntry';
import { gradeOfMealItem } from '../../src/engine/gradeOfMealItem';
import { mealAnalysisPrompt } from '../../src/format/mealAnalysisPrompt';
import { mealDraftJson } from '../../src/format/mealDraftJson';
import { mealFixMessage } from '../../src/format/mealFixMessage';
import { cleanMealAnswer, troubledMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import { foodOn } from '../support/foodOn';

/** MM-586, MM-587: reading an analysed meal, checking its foods, and logging it as one meal. */
const day = CalendarDate.of(2026, 10, 22);

const read = (text: string): MealDraft => {
  const reading = parseMealAnalysis(text);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  return reading.draft;
};

const item = (changes: Partial<MealItemDraft> = {}): MealItemDraft => ({
  name: 'Rice',
  grams: 200,
  usualPortion: { description: '1 cup', grams: 158 },
  kcal: 260,
  proteinG: 5.4,
  carbsG: 57,
  fatG: 0.6,
  fiberG: 0.8,
  micros: new Micronutrients({ sodium: 2, sugars: 0.1, saturatedFat: 0.2 }),
  evidence: { kind: 'cited', citation: 'USDA FoodData Central, FDC ID 169756' },
  ...changes,
});

const tag = { key: 'k1', name: 'Taco night' };

describe('reading an answer', () => {
  it('finds the code block among the assistant’s sentences and reads every food', () => {
    const draft = read(cleanMealAnswer);
    expect(draft.name).toBe('Chicken and rice');
    expect(draft.items.map((i) => i.name)).toEqual(['Grilled chicken breast', 'White rice', 'Steamed broccoli']);
    const [chicken] = draft.items;
    expect(chicken).toMatchObject({ lookup: 'chicken breast roasted', grams: 150, kcal: 248, proteinG: 46.5, carbsG: 0, fatG: 5.4, fiberG: 0 });
    expect(chicken?.usualPortion, 'MM-595').toEqual({ description: '1 breast', grams: 172 });
    expect(read('{"items": [{"usual_portion": {"description": "1 cup"}}]}').items[0]?.usualPortion, 'no grams: not given').toBeUndefined();
    expect(chicken?.micros.of('sodium')).toBe(111);
    expect(chicken?.micros.of('saturatedFat')).toBe(1.5);
    expect(chicken?.micros.of('potassium'), 'an optional micronutrient is kept').toBe(384);
  });

  it('MM-594: reads when the meal was eaten, and leaves a time it cannot read unsaid', () => {
    expect(read(cleanMealAnswer).eatenAt).toBe(19 * 60 + 15);
    expect(read(cleanMealAnswer).eatenOn).toEqual(CalendarDate.of(2026, 10, 22));
    expect(read(troubledMealAnswer).eatenAt, 'not said').toBeUndefined();
    expect(read('{"eaten_at": "dinner time", "items": [{}]}').eatenAt).toBeUndefined();
  });

  it('keeps the assistant’s numbers only when it verified a specific source', () => {
    const [chicken, rice, broccoli] = read(cleanMealAnswer).items;
    expect(chicken?.evidence.kind).toBe('cited');
    expect(rice?.evidence, 'not verified').toEqual({ kind: 'estimated', citation: 'Typical values for cooked white rice' });
    expect(broccoli?.evidence, 'verified, but only a database’s name').toEqual({ kind: 'estimated', citation: 'USDA' });
  });

  it('reads JSON with no code block, and with the curly quotes a chat app may put in', () => {
    expect(read('{"name": "Toast", "items": [{"name": "Toast", "grams": 30}]}').items[0]?.grams).toBe(30);
    expect(read('{“name”: “Toast”, “items”: [{“name”: “Toast”}]}').name).toBe('Toast');
  });

  it('reads a number written as digits, and leaves anything else not given', () => {
    const [toast] = read('{"items": [{"name": "Toast", "grams": "30", "kcal": "lots"}]}').items;
    expect(toast?.grams).toBe(30);
    expect(toast?.kcal).toBeUndefined();
  });

  it('names a food that came with no name, and keeps a meal with no name for the person to name', () => {
    const draft = read('{"items": [{"grams": 30}]}');
    expect(draft.name).toBe('');
    expect(draft.items[0]?.name).toBe('Food 1');
  });

  it.each([
    ['Sure! What should I call this meal?', /^There is no meal in this text/],
    ['```json\n{"items": [{"name": "Toast",\n```', /^The code block is not complete JSON/],
    ['{"name": "Toast"}', /no list of items/],
    ['{"format": "other-app", "items": []}', /another format/],
    ['{"format": "martian-macros-meal", "version": 2, "items": [{}]}', /version 2 of the format; the app reads version 1/],
    ['{"items": []}', /no items/],
  ])('says why %j cannot be read', (text, reason) => {
    const reading = parseMealAnalysis(text);
    expect(reading.kind).toBe('unreadable');
    expect(reading.kind === 'unreadable' ? reading.reason : '').toMatch(reason);
  });

  it('the prompt’s own example is read as a food with nothing wrong with it', () => {
    const draft = read(mealAnalysisPrompt);
    expect(draft.items).toHaveLength(1);
    expect(mealItemProblems(draft.items[0] as MealItemDraft)).toEqual([]);
    expect(draft.items[0]?.evidence.kind).toBe('cited');
  });
});

describe('the prompt', () => {
  it('makes the assistant ask for the name, how much was eaten and where it came from, and holds nothing about the person', () => {
    expect(mealAnalysisPrompt).toMatch(/What should this meal be called\? \(Required/);
    expect(mealAnalysisPrompt).toMatch(/How much of what is shown did I actually eat\?/);
    expect(mealAnalysisPrompt).toMatch(/from a brand or a restaurant/);
    expect(mealAnalysisPrompt, 'MM-595').toMatch(/Every item must have name, lookup, grams, usual_portion,/);
    expect(mealAnalysisPrompt).toMatch(/"usual_portion" is one reasonable serving of that food on its own/);
    expect(mealAnalysisPrompt, 'MM-594').toMatch(/When did I eat it\? \(The day and the time/);
    expect(mealAnalysisPrompt).toMatch(/If I leave question 4 blank, leave "eaten_at" out and don't ask again/);
    expect(mealAnalysisPrompt).toMatch(/never guess a date/);
    expect(mealAnalysisPrompt).not.toMatch(/target|goal|weight|kcal a day|\bage\b|\bsex\b/i);
  });
});

describe('a time of day', () => {
  it.each([
    ['18:30', 18 * 60 + 30],
    ['07:05', 7 * 60 + 5],
    ['0:00', 0],
    ['23:59', 1439],
    ['6:30 PM', 18 * 60 + 30],
    ['6 pm', 18 * 60],
    ['12:15 a.m.', 15],
    ['12 PM', 12 * 60],
    ['24:00', undefined],
    ['18:75', undefined],
    ['13 pm', undefined],
    ['6', undefined],
    ['evening', undefined],
  ])('%j is minute %s', (text, minute) => {
    expect(minuteOfDayIn(text)).toBe(minute);
  });
});

describe('when a meal was eaten', () => {
  it.each([
    ['2026-10-21T18:45', CalendarDate.of(2026, 10, 21), 18 * 60 + 45],
    ['2026-10-21 6:45 PM', CalendarDate.of(2026, 10, 21), 18 * 60 + 45],
    ['2026-10-21', CalendarDate.of(2026, 10, 21), undefined],
    ['18:45', undefined, 18 * 60 + 45],
    ['2026-02-30T12:00', undefined, 12 * 60],
    ['last night', undefined, undefined],
  ])('%j is %s at minute %s', (text, eatenOn, eatenAt) => {
    expect(eatenWhenIn(text)).toEqual({ eatenOn, eatenAt });
  });
});

describe('a specific citation', () => {
  it.each([
    ['USDA FoodData Central, FDC ID 171477', true],
    ['https://www.nutritionix.com/food/big-mac', true],
    ['Open Food Facts 0049000028911', true],
    ['Chipotle published nutrition, chicken burrito bowl', true],
    ['Label in the photo: Kirkland Greek yogurt', true],
    ['USDA', false],
    ['  usda fooddata central ', false],
    ['Estimate', false],
    ['typical values', false],
    ['', false],
    [undefined, false],
  ])('%j is specific: %s', (citation, specific) => {
    expect(isSpecificCitation(citation)).toBe(specific);
  });
});

describe('what is wrong with a food', () => {
  it('a complete food has nothing wrong', () => {
    expect(mealItemProblems(item())).toEqual([]);
  });

  it('names every number the grade needs that is missing', () => {
    const [pancakes] = read(troubledMealAnswer).items;
    expect(mealItemProblems(pancakes as MealItemDraft)).toEqual(['Missing total sugars, saturated fat, sodium.']);
  });

  it('calories that disagree with the macros', () => {
    const [, bacon] = read(troubledMealAnswer).items;
    expect(mealItemProblems(bacon as MealItemDraft)).toEqual([
      '900 kcal in 24 g is more than any food holds (at most 900 kcal per 100 g).',
      '900 kcal does not agree with the macros (protein and carbohydrate at 4 kcal per gram, fat at 9).',
    ]);
  });

  it('MM-595: a food with no usual portion, or one no serving weighs', () => {
    expect(mealItemProblems(item({ usualPortion: undefined }))).toEqual(['Missing its usual portion (a reasonable serving of it on its own, and its grams).']);
    expect(mealItemProblems(item({ usualPortion: { description: '1 pot', grams: 0 } }))[0]).toMatch(/^A usual portion of 0 g is not plausible/);
  });

  it('a number below zero, no name, and an amount no one food weighs', () => {
    expect(mealItemProblems(item({ fatG: -1 }))).toContain('Below zero: fat.');
    expect(mealItemProblems(item({ name: ' ' }))).toContain('It has no name.');
    expect(mealItemProblems(item({ grams: 0 }))[0]).toMatch(/^0 g is not a plausible amount/);
    expect(mealItemProblems(item({ grams: 3001, kcal: 3900, proteinG: 81, carbsG: 855, fatG: 9 }))[0]).toMatch(/^3001 g is not a plausible/);
  });

  it('a food with a problem has no grade until it is fixed', () => {
    expect(gradeOfMealItem(item({ fiberG: undefined }))).toBeUndefined();
    expect(gradeOfMealItem(item())?.kind).toBe('graded');
  });
});

describe('logged as a meal', () => {
  it('a food of a meal is weighed by photo estimate, carries its meal and source, and is graded as the item was', () => {
    const entry = entryOfMealItem(item(), { date: day, meal: 'dinner', eatenAt: 19 * 60, loggedMeal: tag });
    expect(entry).toMatchObject({ name: 'Rice', kcal: 260, source: 'photoEstimate', meal: 'dinner', eatenAt: 19 * 60, loggedMeal: tag });
    expect(entry.portion).toMatchObject({ method: 'photoEstimate', basis: 'calculated', quantity: 200, unit: 'gram' });
    expect(entry.portion?.reference?.nutrition.kcal).toBe(130);
    // MM-595: the usual portion is the food's serving, whatever was eaten of it.
    expect(entry.portion?.reference).toMatchObject({ servingDescription: '1 cup', servingGrams: 158 });
    expect(entry.evidence?.kind).toBe('cited');
    expect(entry.micros.of('sugars')).toBe(0.1);
    expect(gradeOfFoodEntry(entry)).toEqual(gradeOfMealItem(item()));
  });

  it('MM-646: a food that says how it was measured is logged that way, and reads back saying it', () => {
    const entry = entryOfMealItem(item({ method: 'weighed' }), { date: day, meal: 'dinner', eatenAt: undefined, loggedMeal: tag });
    expect(entry.source).toBe('weighed');
    expect(entry.portion?.method).toBe('weighed');
    expect(mealItemOfEntry(entry).method).toBe('weighed');
    expect(mealItemOfEntry(entryOfMealItem(item(), { date: day, meal: 'dinner', eatenAt: undefined, loggedMeal: tag })).method).toBe('photoEstimate');
  });

  it('a food missing its grams or macros is not logged', () => {
    expect(() => entryOfMealItem(item({ kcal: undefined }), { date: day, meal: 'dinner', eatenAt: undefined, loggedMeal: tag })).toThrow();
  });

  it('a logged food read back as an item keeps its grams, numbers and source', () => {
    const entry = entryOfMealItem(item(), { date: day, meal: 'dinner', eatenAt: undefined, loggedMeal: tag });
    expect(mealItemOfEntry(entry)).toMatchObject({
      name: 'Rice',
      grams: 200,
      usualPortion: { description: '1 cup', grams: 158 },
      kcal: 260,
      fiberG: 0.8,
      evidence: item().evidence,
    });
  });

  it('changing the grams scales every number and keeps where they came from', () => {
    const half = mealItemWithGrams(item(), 100);
    expect(half).toMatchObject({ grams: 100, kcal: 130, proteinG: 2.7, carbsG: 28.5, fatG: 0.3, fiberG: 0.4 });
    expect(half.micros.of('sodium')).toBe(1);
    expect(half.evidence).toEqual(item().evidence);
    expect(mealItemWithGrams(item({ grams: undefined }), 50), 'grams not known: only the grams change').toMatchObject({ grams: 50, kcal: 260 });
  });

  it('the day’s intake counts a photo estimate as estimated', () => {
    const entry = entryOfMealItem(item(), { date: day, meal: 'dinner', eatenAt: undefined, loggedMeal: tag });
    const intake = intakeDayFrom(day, [entry, foodOn(day, { kcal: 260 })]);
    expect(intake.estimatedShare).toBeCloseTo(0.5, 9);
  });
});

describe('a meal in the day', () => {
  const ofMeal = (id: number, name: string, key: string, mealName = 'Taco night') =>
    foodOn(day, { name, kcal: 100 }).copyWith({ id, loggedMeal: { key, name: mealName } });

  it('its foods are one row where its first food was; a food on its own is its own row', () => {
    const rows = foodLogRows([
      foodOn(day, { name: 'Oats' }).copyWith({ id: 1 }),
      ofMeal(2, 'Rice', 'k1'),
      foodOn(day, { name: 'Tea' }).copyWith({ id: 3 }),
      ofMeal(4, 'Beans', 'k1'),
    ]);
    expect(rows.map((row) => (row instanceof LoggedMeal ? `${row.name}: ${row.items.map((i) => i.name).join(', ')}` : row.name))).toEqual([
      'Oats',
      'Taco night: Rice, Beans',
      'Tea',
    ]);
  });

  it('a meal’s totals are its foods’ sums, and its day and slot its first food’s', () => {
    const meal = new LoggedMeal([ofMeal(2, 'Rice', 'k1'), ofMeal(4, 'Beans', 'k1')]);
    expect(meal.kcal).toBe(200);
    expect(meal.proteinG).toBe(300);
    expect(meal.date).toEqual(day);
    expect(meal.meal).toBe('dinner');
  });

  it('a meal is made of foods that share its key', () => {
    expect(() => new LoggedMeal([])).toThrow();
    expect(() => new LoggedMeal([foodOn(day)])).toThrow();
    expect(() => new LoggedMeal([ofMeal(1, 'Rice', 'k1'), ofMeal(2, 'Beans', 'k2')])).toThrow();
  });

  it('recent meals are each meal once, by name, as last logged, newest first', () => {
    const newestFirst = [ofMeal(9, 'Salsa', 'k3', 'taco night'), ofMeal(8, 'Rice', 'k3', 'taco night'), ofMeal(5, 'Toast', 'k2', 'Breakfast'), ofMeal(2, 'Rice', 'k1')];
    expect(recentMealsIn(newestFirst, 5).map((m) => [m.key, m.items.map((i) => i.name)])).toEqual([
      ['k3', ['Rice', 'Salsa']],
      ['k2', ['Toast']],
    ]);
    expect(recentMealsIn(newestFirst, 1)).toHaveLength(1);
  });

  it('a copy with new micronutrients brings their sodium; otherwise it keeps its own', () => {
    const salty = foodOn(day, { sodiumMg: 500 });
    expect(salty.copyWith({ name: 'Renamed' }).sodiumMg).toBe(500);
    expect(salty.copyWith({ micros: new Micronutrients({ sodium: 20 }) }).sodiumMg).toBe(20);
    expect(salty.copyWith({ micros: Micronutrients.none }).sodiumMg).toBeUndefined();
  });
});

describe('fixes for the assistant', () => {
  it('names each problem on its food, and hands back the meal as it stands, the person’s changes included', () => {
    const draft = read(troubledMealAnswer);
    const changed = { ...draft, items: [mealItemWithGrams(draft.items[0] as MealItemDraft, 80), draft.items[1] as MealItemDraft] };
    const message = mealFixMessage(changed);
    expect(message).toContain('- Item 1, "Pancakes": Missing total sugars, saturated fat, sodium.');
    expect(message).toContain('- Item 2, "Bacon": 900 kcal in 24 g');
    expect(message).toContain('Keep my changes');
    const back = read(message);
    expect(back.items[0]?.grams, 'the person’s changed grams').toBe(80);
    expect(back.items[0]?.kcal).toBe(181);
  });

  it('asks for a name when the meal has none', () => {
    expect(mealFixMessage({ ...read(troubledMealAnswer), name: '' })).toContain('- The meal has no name.');
  });

  it('the meal written back reads as the same meal', () => {
    const draft = read(cleanMealAnswer);
    const again = read(mealDraftJson(draft));
    expect(again.name).toBe(draft.name);
    expect(again.eatenAt).toBe(19 * 60 + 15);
    expect(again.eatenOn).toEqual(draft.eatenOn);
    expect(again.items.map((i) => [i.name, i.grams, i.usualPortion, i.kcal, i.micros.of('sodium'), i.evidence.kind])).toEqual(
      draft.items.map((i) => [i.name, i.grams, i.usualPortion, i.kcal, i.micros.of('sodium'), i.evidence.kind]),
    );
  });
});
