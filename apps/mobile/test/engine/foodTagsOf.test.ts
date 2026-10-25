import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EvidenceRegister } from '../../src/domain';
import { FoodCue } from '../../src/engine/analysis/language/FoodCue';
import { foodLexicon } from '../../src/engine/analysis/language/foodLexicon';
import type { FoodSense } from '../../src/engine/analysis/language/FoodSense';
import { FoodTag } from '../../src/engine/analysis/language/FoodTag';
import { foodTagsOf } from '../../src/engine/analysis/language/foodTagsOf';
import { foodTokensOf } from '../../src/engine/analysis/language/foodTokensOf';
import { foodWordOf } from '../../src/engine/analysis/language/foodWordOf';
import { indexFoodLexicon } from '../../src/engine/analysis/language/indexFoodLexicon';

/**
 * MM-617: the coach's food-language tagger. What a food's name says about
 * how it was made and what kind of food it is, from a reviewed lexicon. The
 * cases are the ticket's, then names from the hand-checked catalog samples
 * (tool/spikes/coach_model/lexicon/), many of them the tricky ones.
 */

const index = indexFoodLexicon(foodLexicon);

/** A name, the tags it must carry, and the tags it must not. */
const cases: [string, FoodTag[], FoodTag[]][] = [
  ["General Tso's chicken", ['fried', 'sauced'], ['leanProtein']],
  ['Sausage egg and cheese biscuit with extra eggs', ['processedMeat', 'refinedGrain', 'pastry', 'egg', 'cheesy'], ['leanProtein']],
  ['Diet Pepsi Cola 12 Fluid Ounce Aluminum Can (Pepsi)', ['dietDrink'], ['sugaryDrink']],
  ['COOKIE BUTTER, CRUNCHY (LOTUS)', ['dessert', 'spread'], ['fried']],
  ['Chinese buffet', ['buffet', 'restaurant'], []],
  ['Steamed chicken with vegetables', ['steamed', 'leanProtein', 'vegetable'], ['fried']],
  ['Grilled chicken breast', ['grilled', 'leanProtein'], ['fried']],
  ['Chicken nuggets', ['fried', 'breaded'], ['leanProtein']],
  ['Air fried chicken', ['baked', 'leanProtein'], ['fried']],
  ['Unsweetened iced tea', ['dietDrink'], ['sugaryDrink']],
  ['Hummus', ['legume', 'spread'], []],
  ['Biscuits and gravy', ['refinedGrain', 'pastry', 'sauced', 'creamy'], []],
  ['Orange chicken', ['fried', 'breaded', 'sauced'], ['fruit', 'leanProtein']],
  ['Sweet and sour pork', ['fried', 'sauced'], []],
  ['Deep dish pizza', ['refinedGrain', 'cheesy'], []],
  ['Chicken fried steak', ['fried', 'breaded'], ['leanProtein']],
  ['Chicken fried rice', ['fried', 'refinedGrain'], ['breaded', 'leanProtein']],
  ['Egg roll', ['fried'], ['egg']],
  ['Crab rangoon', ['fried', 'creamy'], ['seafood']],
  ["Mac 'n' cheese", ['cheesy', 'creamy', 'refinedGrain'], []],
  ['Hash browns', ['fried'], []],
  ['Coke Zero', ['dietDrink'], ['sugaryDrink']],
  ['Coca-Cola Classic', ['sugaryDrink'], ['dietDrink']],
  ['Grilled cheese sandwich', ['cheesy', 'refinedGrain'], ['grilled']],
  ['Chicken, broilers or fryers, breast, meat only, cooked, roasted', ['roasted', 'leanProtein'], ['fried']],
  ['Beef, round, eye of round, separable lean only, raw', ['leanProtein', 'raw'], ['fattyMeat']],
  ['Chicken, broilers or fryers, thigh, meat and skin, cooked, fried, batter', ['fried', 'breaded'], ['leanProtein']],
  ['PINEAPPLE SLICES IN HEAVY SYRUP', ['fruit'], ['sugaryDrink']],
  ['Apple juice', ['sugaryDrink'], ['fruit']],
  ['Unsweetened apple juice', ['sugaryDrink'], ['dietDrink']],
  ['Cheese flavored crackers', ['snackFood'], ['cheesy']],
  ['High Protein Bar Chocolate Flavour', ['snackFood'], ['candy']],
  ['Strawberry yogurt', ['dairy'], ['fruit']],
  ['Plain greek whole milk yogurt', ['leanProtein', 'dairy'], []],
  ['Non-alcoholic beer', [], ['alcohol']],
  ['Beer battered fish', ['fried', 'breaded', 'seafood'], ['alcohol']],
  ["McDONALD'S, FILET-O-FISH (without tartar sauce)", ['fastFood', 'restaurant', 'fried', 'seafood'], ['sauced', 'creamy']],
  ['Chick-fil-A chicken sandwich', ['fastFood', 'restaurant'], []],
  ["Chili's boneless wings", ['restaurant', 'fried', 'breaded'], []],
  ['Chili powder', [], ['restaurant', 'fastFood', 'vegetable']],
  ['Chipotle peppers in adobo sauce', [], ['restaurant', 'fastFood']],
  ['Domino sugar', [], ['fastFood', 'restaurant']],
  ["Domino's pizza", ['fastFood', 'restaurant', 'cheesy', 'refinedGrain'], []],
  ['Dark chocolate chips', ['candy'], ['fried', 'snackFood']],
  ['Potato chips', ['snackFood', 'fried'], ['vegetable']],
  ['Baked potato chips', ['snackFood', 'baked'], ['fried']],
  ['Carrot cake', ['dessert'], ['vegetable']],
  ['French fries', ['fried'], []],
  ['Sweet potato fries', ['fried', 'vegetable'], []],
  ['93% lean ground beef', ['leanProtein'], ['fattyMeat']],
  ['Lean Cuisine chicken alfredo', ['creamy', 'sauced'], ['leanProtein']],
  ['Peanut butter', ['spread', 'nut'], []],
  ['Milk chocolate peanut butter cups', ['candy'], ['spread', 'nut']],
  ['Butter, salted', ['spread', 'dairy'], []],
  ['Cold water lobster tails with butter', ['seafood', 'leanProtein'], ['spread', 'dairy']],
  ['Turkey bacon', ['processedMeat'], ['leanProtein']],
  ['Egg whites', ['egg', 'leanProtein'], []],
  ['Egg, white, raw', ['egg', 'leanProtein', 'raw'], []],
  ['Milk, chocolate, reduced fat', ['sugaryDrink', 'dairy'], ['candy']],
  ['Candies, milk chocolate', ['candy'], ['sugaryDrink']],
  ['Cheese, cottage, lowfat', ['leanProtein', 'dairy'], ['cheesy']],
  ['SMOKY BOURBON BBQ PULLED PORK SLOW COOKER SAUCE, SMOKY BOURBON BBQ PULLED PORK', ['sauced'], ['fattyMeat']],
  ['Meatballs with spaghetti sauce', ['sauced', 'fattyMeat'], []],
  ['Cookies and cream milkshake', ['sugaryDrink'], ['dessert']],
  ['Vinegar, cider', [], ['sugaryDrink']],
  ['Ginger ale', ['sugaryDrink'], ['alcohol']],
  ['Root beer', ['sugaryDrink'], ['alcohol']],
  ['Asparagus', ['vegetable'], []],
  ['Fish sticks', ['fried', 'breaded', 'seafood'], []],
  ['Tortillas, ready-to-bake or -fry, flour', ['refinedGrain'], ['fried']],
  ['Thin & crispy cookies', ['dessert'], ['fried']],
  ['Crispy chicken sandwich', ['fried', 'refinedGrain'], ['leanProtein']],
  ['Sparkling water', ['dietDrink'], ['sugaryDrink']],
  ['Club soda', ['dietDrink'], ['sugaryDrink']],
  ['Baking soda', [], ['sugaryDrink']],
  ['Chicken flavor ramen noodle soup', ['refinedGrain', 'soup'], ['leanProtein']],
  ['Pie, apple, fast food', ['dessert', 'fastFood', 'restaurant'], ['fruit']],
  ['Golden Corral', ['buffet', 'restaurant'], []],
  ['Frozen greek yogurt', ['dessert'], ['leanProtein']],
  ['Seasoning for chicken', [], ['leanProtein']],
  ['Cinnamon raisin bagel', ['refinedGrain'], ['fruit']],
  ['Whole wheat bread', ['wholeGrain'], ['refinedGrain']],
  ['Rice, brown, long-grain, cooked', ['wholeGrain'], ['refinedGrain']],
  ['Shrimp tempura roll', ['fried', 'breaded', 'seafood'], ['leanProtein']],
  ['Margarita pizza', ['cheesy', 'refinedGrain'], ['alcohol']],
  ['Jalapeño poppers', ['fried', 'breaded', 'cheesy'], []],
  ['Cherry Coke Zero', ['dietDrink'], ['sugaryDrink', 'fruit']],
  ['Strawberries', ['fruit'], []],
  ['Brownies', ['dessert'], []],
  ['Quiches', ['egg', 'pastry'], []],
  ['Mixed greens', ['salad', 'vegetable'], []],
  ['Brussels sprouts', ['vegetable'], []],
];

describe('foodTagsOf', () => {
  it.each(cases)('%s', (name, has, hasNot) => {
    const tags = foodTagsOf(name);
    for (const tag of has) expect(tags, `${name} is ${tag}`).toContain(tag);
    for (const tag of hasNot) expect(tags, `${name} is not ${tag}`).not.toContain(tag);
  });

  it('gives the same tags, in the order FoodTag lists them, every time', () => {
    const name = 'Sausage egg and cheese biscuit with extra eggs';
    const first = [...foodTagsOf(name)];
    expect([...foodTagsOf(name)]).toEqual(first);
    expect(first).toEqual(FoodTag.values.filter((tag) => first.includes(tag)));
  });

  it('tags nothing it cannot read', () => {
    expect(foodTagsOf('').size).toBe(0);
    expect(foodTagsOf('12 oz').size).toBe(0);
    expect(foodTagsOf('Water').size).toBe(0);
  });
});

describe('foodTokensOf', () => {
  const words = (name: string) => foodTokensOf(name, index).map((token) => token.word);

  it('lower-cases, strips accents and drops a possessive inside a word', () => {
    expect(words("General Tso's Chicken")).toEqual(['general', 'tso', 'chicken']);
    expect(words('Jalapeño Poppers')).toEqual(['jalapeno', 'popper']);
  });

  it('reads "&" and "n" as "and", and splits on anything that is not a letter', () => {
    expect(words("Mac 'n' cheese")).toEqual(['mac', 'and', 'cheese']);
    expect(words('Biscuits & gravy')).toEqual(['biscuit', 'and', 'gravy']);
    expect(words('Chick-fil-A')).toEqual(['chick', 'fil', 'a']);
  });

  it('marks brand and packaging noise as stop words', () => {
    const tokens = foodTokensOf('Diet Pepsi 12 Fluid Ounce Can', index);
    expect(tokens.filter((token) => token.stop).map((token) => token.word)).toEqual(['fluid', 'ounce', 'can']);
  });

  it('numbers the parts of a name split by commas and brackets', () => {
    expect(foodTokensOf('Cheese, cottage (lowfat)', index).map((token) => token.part)).toEqual([0, 1, 2]);
  });

  it('reads a lean percentage before the digits go', () => {
    expect(words('93% lean ground beef')).toEqual(['lean', 'ground', 'beef']);
    expect(words('70% lean meat / 30% fat')).toEqual(['regular', 'meat', 'fat']);
    expect(words('No. 126 gemelli')).toEqual(['gemelli']);
  });
});

describe('foodWordOf', () => {
  const folds: [string, string][] = [
    ['wings', 'wing'],
    ['fries', 'fry'],
    ['berries', 'berry'],
    ['cookies', 'cookie'],
    ['brownies', 'brownie'],
    ['quiches', 'quiche'],
    ['peaches', 'peach'],
    ['tomatoes', 'tomato'],
    ['leaves', 'leaf'],
    ['gummies', 'gummy'],
    ['pies', 'pie'],
    ["tso's", 'tso'],
    ['doughnuts', 'donut'],
    ['barbecue', 'bbq'],
  ];
  it.each(folds)('%s is %s', (raw, word) => expect(foodWordOf(raw, index)).toBe(word));

  it.each(['hummus', 'asparagus', 'gas', 'swiss', 'couscous', 'molasses', 'grits'])('%s is not a plural', (raw) => {
    expect(foodWordOf(raw, index)).toBe(raw);
  });

  it('keeps a possessive the lexicon knows: Chili\'s, the restaurant', () => {
    expect(foodWordOf("chili's", index)).toBe("chili's");
  });
});

describe('the lexicon', () => {
  const families = foodLexicon.phrases;
  const keys = families.flatMap((family) => Object.keys(family));

  it('puts each phrase in one family', () => {
    const seen = new Set<string>();
    const twice = keys.filter((key) => (seen.has(key) ? true : (seen.add(key), false)));
    expect(twice).toEqual([]);
  });

  it('writes each phrase the way the tokenizer reads a name', () => {
    const unread = keys.filter((key) => {
      const tokens = foodTokensOf(key, index);
      const back = tokens
        .map((token, at) => (at === 0 ? '' : tokens[at - 1]!.part === token.part ? ' ' : ', ') + token.word)
        .join('');
      return back !== key || !/^[a-z']+(,? [a-z']+)*$/.test(key);
    });
    expect(unread).toEqual([]);
  });

  it('writes phrases in the singular', () => {
    const keep = new Set(foodLexicon.keepPlural);
    const plural = keys.filter((key) =>
      key
        .split(/,? /)
        .some((word) => word.length > 3 && /[^su'i]s$/.test(word) && !keep.has(word)),
    );
    expect(plural).toEqual([]);
  });

  it('never makes a stop word a phrase of its own', () => {
    const stop = new Set(foodLexicon.stopWords);
    expect(keys.filter((key) => stop.has(key))).toEqual([]);
  });

  it('uses only tags and cues, and every cue', () => {
    const known = new Set<FoodSense>([...FoodTag.values, ...FoodCue.values]);
    const used = new Set<FoodSense>();
    for (const family of families) for (const senses of Object.values(family)) for (const sense of senses) used.add(sense);
    for (const rule of foodLexicon.rules) {
      for (const sense of [...rule.when, ...rule.also, ...rule.unless, ...rule.remove, ...rule.add]) used.add(sense);
    }
    expect([...used].filter((sense) => !known.has(sense))).toEqual([]);
    expect(FoodCue.values.filter((cue) => !used.has(cue))).toEqual([]);
  });

  it('has an evidence row', () => {
    const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));
    expect(register.row('foodLexicon')?.grade).toBe('judgement');
  });
});
