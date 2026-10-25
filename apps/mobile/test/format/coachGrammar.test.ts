import { describe, expect, it } from 'vitest';
import { coachCauseWords } from '../../src/format/coach/coachCauseWords';
import { coachPhrase } from '../../src/format/coach/coachPhrase';
import { countWord } from '../../src/format/coach/countWord';
import { foodInSentence } from '../../src/format/coach/foodInSentence';
import { listText } from '../../src/format/coach/listText';
import { multipleText } from '../../src/format/coach/multipleText';
import { phrasingIndex } from '../../src/format/coach/phrasingIndex';
import { pluralText } from '../../src/format/coach/pluralText';
import { possessiveText } from '../../src/format/coach/possessiveText';
import { readableFoodName } from '../../src/format/coach/readableFoodName';
import { roughAmount } from '../../src/format/coach/roughAmount';
import { sentenceCase } from '../../src/format/coach/sentenceCase';

/** MM-617's grammar helpers: lists, plurals, numbers, capitals, possessives and food names made readable. */
describe('lists', () => {
  it('one, two, and three or more with commas and "and"', () => {
    expect(listText([])).toBe('');
    expect(listText(["General Tso's chicken"])).toBe("General Tso's chicken");
    expect(listText(["General Tso's chicken", 'hot and sour soup'])).toBe("General Tso's chicken and hot and sour soup");
    expect(listText(['fried rice', 'lo mein', 'egg rolls'])).toBe('fried rice, lo mein and egg rolls');
  });
});

describe('plurals and counts', () => {
  it('a count with its noun', () => {
    expect(pluralText(1, 'day')).toBe('1 day');
    expect(pluralText(3, 'day')).toBe('3 days');
    expect(pluralText(1054, 'set')).toBe('1,054 sets');
    expect(pluralText(2, 'recorded night')).toBe('2 recorded nights');
  });

  it('small counts as words', () => {
    expect(countWord(2)).toBe('two');
    expect(countWord(3)).toBe('three');
    expect(countWord(12)).toBe('12');
    expect(countWord(1054)).toBe('1,054');
  });
});

describe('numbers', () => {
  it('a multiple to one decimal', () => {
    expect(multipleText(6923 / 1800)).toBe('3.8×');
    expect(multipleText(2)).toBe('2×');
  });

  it('estimates to the nearest 5 under 100, the nearest 10 from it', () => {
    expect(roughAmount(23.4)).toBe('25');
    expect(roughAmount(22)).toBe('20');
    expect(roughAmount(132)).toBe('130');
    expect(roughAmount(1054)).toBe('1,050');
  });
});

describe('capitals and possessives', () => {
  it('a sentence that opens with a food name is capitalized; one that opens with a number is not', () => {
    expect(sentenceCase('cookie butter: 170 kcal.')).toBe('Cookie butter: 170 kcal.');
    expect(sentenceCase("general Tso's")).toBe("General Tso's");
    expect(sentenceCase('1,054 kcal over.')).toBe('1,054 kcal over.');
    expect(sentenceCase('4.8 g protein.')).toBe('4.8 g protein.');
  });

  it('"General Tso\'s" stays; another name takes "\'s"', () => {
    expect(possessiveText("General Tso's")).toBe("General Tso's");
    expect(possessiveText('Barbell bench press')).toBe("Barbell bench press's");
  });
});

describe('food names, as logged and made readable', () => {
  it.each([
    ['COOKIE BUTTER, CRUNCHY (LOTUS)', 'Cookie butter'],
    ['Diet Pepsi Cola 12 Fluid Ounce Aluminum Can (Pepsi)', 'Diet Pepsi Cola'],
    ['CHEESE, COTTAGE', 'Cheese, cottage'],
    ["General Tso's chicken", "General Tso's chicken"],
    ['Sausage egg and cheese biscuit with extra eggs', 'Sausage egg and cheese biscuit with extra eggs'],
    ['Greek yogurt, plain 500 g tub', 'Greek yogurt, plain'],
    ['Coca-Cola 330 ml', 'Coca-Cola'],
    ['  Oats  ', 'Oats'],
  ])('%s → %s', (name, readable) => expect(readableFoodName(name)).toBe(readable));

  it('mid-sentence: a common first word goes to lower case, a proper one keeps its capital', () => {
    expect(foodInSentence('Sausage egg and cheese biscuit with extra eggs')).toBe('sausage egg and cheese biscuit with extra eggs');
    expect(foodInSentence('COOKIE BUTTER, CRUNCHY (LOTUS)')).toBe('cookie butter');
    expect(foodInSentence("General Tso's chicken")).toBe("General Tso's chicken");
    expect(foodInSentence('Chinese buffet')).toBe('Chinese buffet');
    expect(foodInSentence('Greek yogurt with berries')).toBe('Greek yogurt with berries');
    expect(foodInSentence('Diet Pepsi Cola 12 Fluid Ounce Aluminum Can (Pepsi)')).toBe('Diet Pepsi Cola');
    expect(foodInSentence('BBQ ribs')).toBe('BBQ ribs');
  });

  it('what did it, for the headline', () => {
    expect(coachCauseWords({ meal: 'lunch', mealName: 'Chinese buffet' })).toBe('the buffet');
    expect(coachCauseWords({ meal: 'breakfast', mealName: 'Sausage egg and cheese biscuit' })).toBe('the sausage egg and cheese biscuit');
    expect(coachCauseWords({ meal: 'dinner' })).toBe('dinner');
    expect(coachCauseWords({ food: { key: 'peanut butter', name: 'Peanut butter', kcal: 400, fatG: 34, proteinG: 14 } })).toBe('peanut butter');
    expect(coachCauseWords(undefined)).toBeUndefined();
  });
});

describe('the choice of phrasing', () => {
  it('is the same for the same key, and spread over the phrasings across keys', () => {
    expect(phrasingIndex('close|day:20750:backToPlan:close|20750', 3)).toBe(phrasingIndex('close|day:20750:backToPlan:close|20750', 3));
    const seen = new Set(Array.from({ length: 30 }, (_, i) => phrasingIndex(`close|day:${20750 + i}:backToPlan:close|${20750 + i}`, 3)));
    expect(seen.size).toBe(3);
    expect(phrasingIndex('anything', 1)).toBe(0);
  });

  it('fills a phrasing and says it as a sentence; a missing value is a programming error', () => {
    expect(coachPhrase('causeFoods', 'k', { foods: "general Tso's chicken" })).toMatch(/^[A-Z]/);
    expect(() => coachPhrase('causeFoods', 'k', {})).toThrow(/causeFoods needs \{foods\}/);
    expect(coachPhrase('shareWholeDayWords', 'k', { target: '2,175' }, { piece: true })).toMatch(/^more than/);
  });
});
