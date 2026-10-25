import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { Caution } from '../../src/domain/Caution';
import { EvidenceRegister } from '../../src/domain';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { FoodGroup } from '../../src/domain/food/FoodGroup';
import type { Meal } from '../../src/domain/Meal';
import { tableSwapOf } from '../../src/engine/analysis/food/tableSwapOf';
import { coachSwapOf } from '../../src/engine/analysis/swap/coachSwapOf';
import { coachSwapTable } from '../../src/engine/analysis/swap/coachSwapTable';
import { nearestByName } from '../../src/engine/analysis/swap/nearestByName';
import type { SwapInput } from '../../src/engine/analysis/swap/SwapInput';
import { swapFor } from '../../src/engine/analysis/swap/swapFor';
import { swapNameIndexOf } from '../../src/engine/analysis/swap/swapNameIndexOf';
import { SwapRule } from '../../src/engine/analysis/swap/SwapRule';
import { swapWordsOf } from '../../src/engine/analysis/swap/swapWordsOf';
import type { TradeCatalogFood } from '../../src/engine/analysis/TradeCatalogFood';
import type { InsightSafeguards } from '../../src/engine/InsightSafeguards';
import { InMemoryTradeCatalog } from '../../src/fixtures/InMemoryTradeCatalog';

/**
 * MM-617: what goes in a food's place. The person's own food first, then
 * the catalog's nearest better food by name and preparation, then the
 * coach's table of classic swaps; nothing a safeguard forbids.
 *
 * The fixture foods are named so their tags (`foodTagsOf`) are plain:
 * "Fried chicken", "Chicken breast, grilled", "Dessert lasagna".
 */

const today = CalendarDate.of(2026, 10, 24);
let nextId = 1;

interface Food {
  readonly name: string;
  readonly meal: Meal;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly sodiumMg?: number | undefined;
}

/** `food` logged on each of `days` before today (0 is today). */
function logged(food: Food, days: readonly number[]): FoodEntry[] {
  return days.map(
    (day) =>
      new FoodEntry({
        id: nextId++,
        date: today.addDays(-day),
        meal: food.meal,
        name: food.name,
        kcal: food.kcal,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        sodiumMg: food.sodiumMg,
        source: 'labelServing',
      }),
  );
}

const safe: InsightSafeguards = {
  adult: true,
  eatingDisorderHistory: false,
  weightHidden: false,
  paused: false,
  underEating: false,
  cautions: new Set(),
};

/** The swap of `food`, eaten today at its meal, with `history` (today's entries of it are added). */
function input(food: Food, changes: Partial<SwapInput> = {}): SwapInput {
  return {
    food: {
      key: food.name.trim().toLowerCase(),
      name: food.name,
      kcal: food.kcal,
      proteinG: food.proteinG,
      fatG: food.fatG,
      carbsG: food.carbsG,
      sodiumMg: food.sodiumMg,
    },
    meal: food.meal,
    goal: 'fatLoss',
    history: logged(food, [0]),
    catalog: undefined,
    safeguards: safe,
    cautions: new Set(),
    ...changes,
  };
}

const catalogFood = (name: string, group: FoodGroup, kcal: number, proteinG: number, carbsG: number, fatG: number): TradeCatalogFood => ({
  name,
  group,
  grams: 200,
  kcal,
  proteinG,
  carbsG,
  fatG,
  sodiumMg: undefined,
  fiberG: undefined,
  alcoholG: undefined,
  grade: undefined,
});

const catalogOf = (...foods: TradeCatalogFood[]) => new InMemoryTradeCatalog(foods.map((food, at) => ({ packId: 'pack', foodId: at + 1, food })));

// The owner's day of 2026-10-24.
const generalTso: Food = { name: "General Tso's chicken", meal: 'lunch', kcal: 744, proteinG: 32, carbsG: 66, fatG: 33, sodiumMg: 1500 };
const biscuit: Food = { name: 'Sausage egg and cheese biscuit with extra eggs', meal: 'breakfast', kcal: 691, proteinG: 31, carbsG: 40, fatG: 45 };
const cookieButter: Food = { name: 'Cookie butter', meal: 'snack', kcal: 170, proteinG: 1, carbsG: 19, fatG: 10 };
/** The rest of the 13-food Chinese buffet, each logged today only. */
const buffet: readonly Food[] = [
  generalTso,
  { name: 'Fried rice', meal: 'lunch', kcal: 340, proteinG: 8, carbsG: 50, fatG: 12 },
  { name: 'Lo mein', meal: 'lunch', kcal: 310, proteinG: 10, carbsG: 43, fatG: 11 },
  { name: 'Egg roll', meal: 'lunch', kcal: 220, proteinG: 7, carbsG: 21, fatG: 12 },
  { name: 'Crab rangoon', meal: 'lunch', kcal: 150, proteinG: 4, carbsG: 14, fatG: 9 },
  { name: 'Hot and sour soup', meal: 'lunch', kcal: 95, proteinG: 6, carbsG: 9, fatG: 3 },
  { name: 'Sweet and sour pork', meal: 'lunch', kcal: 250, proteinG: 10, carbsG: 30, fatG: 10 },
  { name: 'Beef and broccoli', meal: 'lunch', kcal: 150, proteinG: 13, carbsG: 8, fatG: 7 },
  { name: 'Steamed dumplings', meal: 'lunch', kcal: 130, proteinG: 7, carbsG: 14, fatG: 5 },
  { name: 'Orange chicken', meal: 'lunch', kcal: 210, proteinG: 9, carbsG: 25, fatG: 8 },
  { name: 'Honey walnut shrimp', meal: 'lunch', kcal: 130, proteinG: 6, carbsG: 9, fatG: 8 },
  { name: 'Green beans', meal: 'lunch', kcal: 40, proteinG: 2, carbsG: 6, fatG: 1 },
  { name: 'Fortune cookie', meal: 'lunch', kcal: 30, proteinG: 0, carbsG: 7, fatG: 0 },
];
const ownersDay = [...buffet.flatMap((f) => logged(f, [0])), ...logged(biscuit, [0]), ...logged(cookieButter, [0])];

describe('swapFor (MM-617)', () => {
  it("the owner's buffet day: General Tso's chicken gets steamed chicken with vegetables, with figures", () => {
    const swap = swapFor(input(generalTso, { history: ownersDay }));
    expect(swap).toEqual({
      name: 'steamed chicken with mixed vegetables, sauce on the side',
      kcal: 265,
      proteinG: 35,
      fatG: 4,
      source: 'table',
    });
  });

  it("the buffet day with a catalog: the catalog's steamed chicken comes before the table", () => {
    const catalog = catalogOf(
      catalogFood("General Tso's chicken", 'preparedMeals', 744, 32, 66, 33),
      catalogFood('Steamed chicken with vegetables', 'preparedMeals', 480, 50, 30, 16),
      catalogFood('Sweet and sour chicken', 'preparedMeals', 650, 25, 80, 22),
    );
    const swap = swapFor(input(generalTso, { history: ownersDay, catalog, group: 'preparedMeals' }));
    expect(swap).toEqual({ name: 'Steamed chicken with vegetables', kcal: 480, proteinG: 50, fatG: 16, source: 'catalog' });
  });

  it('the biscuit gets two eggs on an English muffin with a slice of cheese: about 400 kcal, half the fat', () => {
    const swap = swapFor(input(biscuit, { history: ownersDay }));
    expect(swap).toEqual({ name: 'two eggs on an English muffin with a slice of cheese', kcal: 390, proteinG: 24, fatG: 20, source: 'table' });
    expect(swap?.fatG ?? 99).toBeLessThanOrEqual(biscuit.fatG / 2);
  });

  it('cookie butter gets a better snack, or nothing when none fits', () => {
    expect(swapFor(input(cookieButter, { history: ownersDay }))).toEqual({
      name: 'plain Greek yogurt with berries',
      kcal: 140,
      proteinG: 18,
      fatG: 1,
      source: 'table',
    });
    // With kidney disease each better snack adds too much protein, so none fits.
    expect(swapFor(input(cookieButter, { history: ownersDay, cautions: new Set<Caution>(['chronicKidneyDisease']) }))).toBeUndefined();
    // A snack the person logs comes first.
    const yogurt: Food = { name: 'Greek yogurt with berries', meal: 'snack', kcal: 150, proteinG: 15, carbsG: 18, fatG: 2 };
    const history = [...ownersDay, ...logged(yogurt, [3, 9])];
    expect(swapFor(input(cookieButter, { history }))).toMatchObject({ name: 'Greek yogurt with berries', source: 'logged' });
  });

  describe('the order: own food, then the catalog, then the table', () => {
    const fried: Food = { name: 'Fried chicken', meal: 'lunch', kcal: 480, proteinG: 36, carbsG: 16, fatG: 30 };
    const grilled: Food = { name: 'Chicken breast, grilled', meal: 'lunch', kcal: 300, proteinG: 56, carbsG: 0, fatG: 6.5 };
    const catalog = catalogOf(
      catalogFood('Fried chicken', 'meatAndPoultry', 480, 36, 16, 30),
      catalogFood('Chicken breast, roasted', 'meatAndPoultry', 300, 56, 0, 6.5),
    );
    const withOwn = [...logged(fried, [0]), ...logged(grilled, [2, 5, 9])];

    it("a food the person logs in that meal comes first, even with a catalog and a table row", () => {
      expect(swapFor(input(fried, { history: withOwn, catalog, group: 'meatAndPoultry' }))).toEqual({
        name: 'Chicken breast, grilled',
        kcal: 300,
        proteinG: 56,
        fatG: 6.5,
        source: 'logged',
      });
    });

    it('logged on one day only, or at another meal, it is not the own food', () => {
      const once = [...logged(fried, [0]), ...logged(grilled, [4])];
      expect(swapFor(input(fried, { history: once, catalog, group: 'meatAndPoultry' }))?.source).toBe('catalog');
      const atDinner = [...logged(fried, [0]), ...logged({ ...grilled, meal: 'dinner' }, [2, 5, 9])];
      expect(swapFor(input(fried, { history: atDinner, catalog, group: 'meatAndPoultry' }))?.source).toBe('catalog');
    });

    it("then the catalog's nearest better food", () => {
      expect(swapFor(input(fried, { catalog, group: 'meatAndPoultry' }))).toEqual({
        name: 'Chicken breast, roasted',
        kcal: 300,
        proteinG: 56,
        fatG: 6.5,
        source: 'catalog',
      });
    });

    it('then the table, without a catalog or without the food’s group', () => {
      const table = { name: 'a grilled chicken breast, sauce on the side', kcal: 200, proteinG: 37, fatG: 4, source: 'table' };
      expect(swapFor(input(fried))).toEqual(table);
      expect(swapFor(input(fried, { catalog }))).toEqual(table);
    });
  });

  describe('the catalog step', () => {
    const friedThigh: Food = { name: 'Fried chicken thigh', meal: 'dinner', kcal: 260, proteinG: 16, carbsG: 10, fatG: 17 };

    it('ranks by name: "Fried chicken thigh" gets "Chicken thigh, roasted" over "Chicken salad, creamy"', () => {
      const catalog = catalogOf(
        catalogFood('Fried chicken thigh', 'meatAndPoultry', 260, 16, 10, 17),
        catalogFood('Chicken salad, creamy', 'meatAndPoultry', 200, 20, 6, 9),
        catalogFood('Chicken thigh, roasted', 'meatAndPoultry', 190, 26, 0, 9),
      );
      expect(swapFor(input(friedThigh, { catalog, group: 'meatAndPoultry' }))).toMatchObject({
        name: 'Chicken thigh, roasted',
        source: 'catalog',
      });
    });

    it('TF-IDF cosine: a word rare in the group weighs more than one most names share', () => {
      const index = swapNameIndexOf([
        catalogFood('Chicken thigh, roasted', 'meatAndPoultry', 190, 26, 0, 9),
        catalogFood('Chicken salad, creamy', 'meatAndPoultry', 200, 20, 6, 9),
        catalogFood('Chicken breast, roasted', 'meatAndPoultry', 165, 31, 0, 4),
        catalogFood('Beef stew', 'meatAndPoultry', 250, 18, 20, 10),
      ]);
      const nearest = nearestByName(index, 'Fried chicken thigh').map((m) => m.food.food.name);
      expect(nearest[0]).toBe('Chicken thigh, roasted');
      expect(nearest).not.toContain('Beef stew');
      // The same name always gives the same order.
      expect(nearestByName(index, 'Fried chicken thigh').map((m) => m.food.food.name)).toEqual(nearest);
    });

    it('keeps the same protein source where the food has one', () => {
      const catalog = catalogOf(
        catalogFood('Fried chicken thigh', 'meatAndPoultry', 260, 16, 10, 17),
        catalogFood('Thigh of turkey, roasted', 'meatAndPoultry', 190, 26, 0, 9),
        catalogFood('Chicken drumstick, roasted', 'meatAndPoultry', 190, 26, 0, 9),
      );
      expect(swapFor(input(friedThigh, { catalog, group: 'meatAndPoultry' }))?.name).toBe('Chicken drumstick, roasted');
    });

    it('a better preparation is required: fried for fried is never the swap', () => {
      const catalog = catalogOf(
        catalogFood('Fried chicken thigh', 'meatAndPoultry', 260, 16, 10, 17),
        catalogFood('Chicken thigh, fried', 'meatAndPoultry', 190, 26, 0, 9),
      );
      const swap = swapFor(input(friedThigh, { catalog, group: 'meatAndPoultry' }));
      expect(swap?.name).not.toBe('Chicken thigh, fried');
      expect(swap?.source).toBe('table');
    });

    it('a better preparation ranks first: sauce-free over a sauced, nearer name', () => {
      const sauced: Food = { name: 'Chicken in teriyaki sauce', meal: 'dinner', kcal: 400, proteinG: 30, carbsG: 30, fatG: 18 };
      const catalog = catalogOf(
        catalogFood('Chicken in teriyaki sauce', 'meatAndPoultry', 400, 30, 30, 18),
        catalogFood('Chicken breast in teriyaki sauce', 'meatAndPoultry', 320, 38, 20, 8),
        catalogFood('Chicken breast, grilled', 'meatAndPoultry', 300, 45, 0, 9),
      );
      expect(swapFor(input(sauced, { catalog, group: 'meatAndPoultry' }))?.name).toBe('Chicken breast, grilled');
    });

    it('a dessert never replaces a meal food', () => {
      const lasagna: Food = { name: 'Beef lasagna', meal: 'dinner', kcal: 600, proteinG: 30, carbsG: 50, fatG: 30 };
      const dessert = catalogFood('Dessert lasagna', 'preparedMeals', 450, 31, 50, 14);
      const only = catalogOf(catalogFood('Beef lasagna', 'preparedMeals', 600, 30, 50, 30), dessert);
      expect(swapFor(input(lasagna, { catalog: only, group: 'preparedMeals' }))).toBeUndefined();
      const both = catalogOf(
        catalogFood('Beef lasagna', 'preparedMeals', 600, 30, 50, 30),
        dessert,
        catalogFood('Lasagna, vegetable', 'preparedMeals', 450, 31, 55, 12),
      );
      expect(swapFor(input(lasagna, { catalog: both, group: 'preparedMeals' }))?.name).toBe('Lasagna, vegetable');
    });

    it("a better profile is required, by MM-607's matching rules: not eat less in disguise", () => {
      const catalog = catalogOf(
        catalogFood('Fried chicken thigh', 'meatAndPoultry', 260, 16, 10, 17),
        // Half the calories: under the 0.6 floor.
        catalogFood('Chicken thigh, roasted', 'meatAndPoultry', 130, 18, 0, 6),
      );
      expect(swapFor(input(friedThigh, { catalog, group: 'meatAndPoultry' }))?.source).toBe('table');
    });
  });

  describe('safeguards', () => {
    const cautions = (...list: Caution[]) => new Set<Caution>(list);
    const foods = [generalTso, biscuit, cookieButter];

    it('an eating-disorder history gives no swap at all', () => {
      for (const food of foods) {
        expect(swapFor(input(food, { history: ownersDay, safeguards: { ...safe, eatingDisorderHistory: true } }))).toBeUndefined();
        expect(swapFor(input(food, { history: ownersDay, cautions: cautions('eatingDisorderHistory') }))).toBeUndefined();
        expect(swapFor(input(food, { history: ownersDay, safeguards: { ...safe, cautions: cautions('eatingDisorderHistory') } }))).toBeUndefined();
      }
    });

    it('under 18, paused, under-eating or after bariatric surgery: nothing', () => {
      for (const food of foods) {
        expect(swapFor(input(food, { safeguards: { ...safe, adult: false } }))).toBeUndefined();
        expect(swapFor(input(food, { safeguards: { ...safe, paused: true } }))).toBeUndefined();
        expect(swapFor(input(food, { safeguards: { ...safe, underEating: true } }))).toBeUndefined();
        expect(swapFor(input(food, { cautions: cautions('bariatricSurgery') }))).toBeUndefined();
      }
    });

    it('kidney disease: no protein-motivated swap, and none adding much protein', () => {
      const ckd = cautions('chronicKidneyDisease');
      const fried: Food = { name: 'Fried chicken', meal: 'lunch', kcal: 480, proteinG: 36, carbsG: 16, fatG: 30 };
      const grilled: Food = { name: 'Chicken breast, grilled', meal: 'lunch', kcal: 300, proteinG: 56, carbsG: 0, fatG: 6.5 };
      const history = [...logged(fried, [0]), ...logged(grilled, [2, 5, 9])];
      // The person's grilled chicken adds 20 g of protein: not offered. The table's keeps protein the same: offered.
      expect(swapFor(input(fried, { history, cautions: ckd }))).toMatchObject({ name: 'a grilled chicken breast, sauce on the side', source: 'table' });
      // A protein shake for a milkshake adds 17 g: not offered.
      const shake: Food = { name: 'Chocolate milkshake', meal: 'snack', kcal: 600, proteinG: 15, carbsG: 85, fatG: 24 };
      expect(swapFor(input(shake))).toMatchObject({ name: 'a protein shake made with milk' });
      expect(swapFor(input(shake, { cautions: ckd }))).toBeUndefined();
      // A catalog food better only for protein is not offered.
      const wrap: Food = { name: 'Chicken wrap', meal: 'lunch', kcal: 400, proteinG: 20, carbsG: 40, fatG: 15 };
      const catalog = catalogOf(
        catalogFood('Chicken wrap', 'preparedMeals', 400, 20, 40, 15),
        catalogFood('Chicken wrap, high protein', 'preparedMeals', 420, 40, 30, 14),
      );
      expect(swapFor(input(wrap, { catalog, group: 'preparedMeals' }))).toMatchObject({ source: 'catalog' });
      expect(swapFor(input(wrap, { catalog, group: 'preparedMeals', cautions: ckd }))).toBeUndefined();
    });

    it('insulin or a sulfonylurea: no carbohydrate-lowering swap, and none when carbohydrate is not known', () => {
      const insulin = cautions('insulinOrSulfonylurea');
      expect(swapFor(input(generalTso, { history: ownersDay, cautions: insulin }))).toBeUndefined();
      expect(swapFor(input(biscuit, { history: ownersDay, cautions: insulin }))).toBeUndefined();
      const soda: Food = { name: 'Coca-Cola', meal: 'lunch', kcal: 140, proteinG: 0, carbsG: 39, fatG: 0 };
      expect(swapFor(input(soda))).toMatchObject({ name: 'the diet or zero-sugar version', kcal: 0 });
      expect(swapFor(input(soda, { cautions: insulin }))).toBeUndefined();
      // Bacon for Canadian bacon lowers no carbohydrate: still offered, but not when the carbohydrate is unknown.
      const bacon: Food = { name: 'Bacon', meal: 'breakfast', kcal: 130, proteinG: 9, carbsG: 0, fatG: 10 };
      expect(swapFor(input(bacon, { cautions: insulin }))).toMatchObject({ name: 'two slices of Canadian bacon', source: 'table' });
      const unknown = input(bacon, { cautions: insulin });
      const { carbsG: _carbs, ...food } = unknown.food;
      expect(swapFor({ ...unknown, food })).toBeUndefined();
    });

    it('pregnancy, breastfeeding, underweight and low body weight: no calorie-lowering swap', () => {
      for (const caution of ['pregnancy', 'breastfeeding', 'underweight', 'lowBodyWeight'] as const) {
        for (const food of foods) {
          const swap = swapFor(input(food, { history: ownersDay, cautions: cautions(caution) }));
          expect(swap === undefined || (swap.kcal ?? 0) >= food.kcal, `${caution}: ${food.name}`).toBe(true);
        }
        expect(swapFor(input(biscuit, { safeguards: { ...safe, cautions: cautions(caution) } }))).toBeUndefined();
      }
    });
  });
});

describe('the swap table (MM-617)', () => {
  it.each([
    ['General Tso’s chicken', 'generalTso'],
    ['Orange chicken', 'generalTso'],
    ['Sweet and sour pork', 'generalTso'],
    ['Chicken fried rice', 'friedRice'],
    ['Lo mein', 'loMein'],
    ['Egg rolls', 'eggRoll'],
    ['Crab rangoon', 'eggRoll'],
    ['Fried chicken sandwich', 'friedChickenSandwich'],
    ['Country fried steak', 'friedSteak'],
    ['Chicken nuggets', 'friedChicken'],
    ['Chicken tenders', 'friedChicken'],
    ['Buffalo wings', 'friedChicken'],
    ['Fish and chips', 'friedSeafood'],
    ['Double cheeseburger', 'doubleBurger'],
    ['Bacon cheeseburger', 'burger'],
    ['French fries', 'fries'],
    ['Onion rings', 'fries'],
    ['Deep dish pizza', 'deepDishPizza'],
    ['Pepperoni pizza', 'pizza'],
    ['Fettuccine alfredo', 'alfredo'],
    ['Mac & cheese', 'macAndCheese'],
    ['Chicken burrito', 'burrito'],
    ['Cheese quesadilla', 'quesadilla'],
    ['Nachos', 'nachos'],
    ['Biscuits and gravy', 'biscuit'],
    ['Sausage, egg and cheese biscuit', 'biscuit'],
    ['Bacon, egg and cheese croissant', 'croissantSandwich'],
    ['Pancakes with syrup', 'pancakes'],
    ['Glazed donut', 'pastry'],
    ['Pork sausage links', 'sausage'],
    ['Bacon', 'bacon'],
    ['Chocolate milkshake', 'milkshake'],
    ['Caramel frappuccino', 'frappuccino'],
    ['Mocha', 'sweetCoffee'],
    ['Sweet tea', 'sweetTea'],
    ['Lemonade', 'lemonade'],
    ['Coca-Cola', 'soda'],
    ['Beer', 'lightBeer'],
    ['Margarita', 'margarita'],
    ['Potato chips', 'chips'],
    ['Chocolate chip cookies', 'cookie'],
    ['Cookie butter', 'cookie'],
    ['Candy bar', 'candy'],
    ['Ice cream', 'iceCream'],
    ['Chicken Caesar salad', 'creamySalad'],
    ['Ranch dressing', 'creamyDressing'],
    ['Clam chowder', 'creamSoup'],
    ['Mashed potatoes with gravy', 'withGravy'],
    ['Sausage gravy', 'gravy'],
    ['Mozzarella sticks', 'fried'],
  ])('%s matches %s', (name, key) => {
    expect(coachSwapOf(name)?.key).toBe(key);
  });

  it.each(['Grilled chicken breast', 'Diet Coke', 'Soda bread', 'Stir-fried vegetables', 'English muffin', 'Porterhouse steak'])(
    '%s matches no row',
    (name) => {
      expect(coachSwapOf(name)).toBeUndefined();
    },
  );

  it('matches whole words in the singular: "cola" is not in "chocolate", "fries" meets "fry"', () => {
    expect(swapWordsOf("General Tso's Chicken")).toEqual(['general', 'tso', 'chicken']);
    expect(swapWordsOf('Jalapeño poppers & fries')).toEqual(['jalapeno', 'popper', 'and', 'fry']);
    expect(swapWordsOf('Cookies, brownies, berries')).toEqual(['cookie', 'brownie', 'berry']);
    expect(coachSwapOf('Chocolate')?.key).toBe('candy');
  });

  it('a drink row needs the drinks group where the group is known', () => {
    expect(coachSwapOf('Lemonade', 'drinks')?.key).toBe('lemonade');
    expect(coachSwapOf('Lemonade', 'snacksAndSweets')?.key).not.toBe('lemonade');
  });

  it('the egg roll gets hot and sour soup only when it was saltier; otherwise two steamed dumplings', () => {
    const roll = { key: 'egg roll', name: 'Egg roll', kcal: 220, proteinG: 7, fatG: 12, carbsG: 21 };
    expect(tableSwapOf({ ...roll, sodiumMg: 1000 })?.name).toBe('a cup of hot and sour soup');
    expect(tableSwapOf({ ...roll, sodiumMg: 420 })?.name).toBe('two steamed dumplings');
    expect(tableSwapOf(roll)?.name).toBe('two steamed dumplings');
  });

  it('a share row keeps the food and changes how it is made: the burrito without its tortilla', () => {
    const burrito = { key: 'chicken burrito', name: 'Chicken burrito', kcal: 900, proteinG: 45, fatG: 30, carbsG: 100 };
    expect(tableSwapOf(burrito)).toEqual({ name: 'a burrito bowl: the same fillings, no tortilla', kcal: 680, proteinG: 39, fatG: 24, source: 'table' });
    // A burrito too small to lose a tortilla and keep its protein gets nothing.
    expect(tableSwapOf({ ...burrito, kcal: 380, proteinG: 13, fatG: 11, carbsG: 55 })).toBeUndefined();
  });

  it('a swap must save, keep protein, and add no calories: a plain biscuit gets an English muffin, not the egg sandwich', () => {
    const plain = { key: 'biscuit', name: 'Biscuit', kcal: 212, proteinG: 4, fatG: 10, carbsG: 27 };
    expect(tableSwapOf(plain)?.name).toBe('an English muffin');
    // A small burger saves too little with the lettuce wrap.
    expect(tableSwapOf({ key: 'hamburger', name: 'Hamburger', kcal: 230, proteinG: 12, fatG: 9, carbsG: 28 })).toBeUndefined();
  });

  it('every row is reviewed: unique keys, words for the person, figures, and a USDA source', () => {
    const keys = coachSwapTable.map((row) => row.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThanOrEqual(40);
    for (const row of coachSwapTable) {
      expect(row.match.length, row.key).toBeGreaterThan(0);
      expect(row.replacements.length, row.key).toBeGreaterThan(0);
      expect(row.source, row.key).toMatch(/USDA FoodData Central/);
      for (const r of row.replacements) {
        expect(r.words, row.key).toMatch(/^[a-z]/);
        expect(r.serving !== undefined || r.ofFood !== undefined, row.key).toBe(true);
      }
    }
  });

  it('every row and every swap figure has an evidence row', () => {
    const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));
    const registered = new Set(register.rows.map((row) => row.name));
    const expected = [
      'swapFor',
      ...coachSwapTable.map((row) => `coachSwapTable.${row.key}`),
      ...Object.keys(SwapRule).map((name) => `SwapRule.${name}`),
    ];
    expect(expected.filter((name) => !registered.has(name)), 'Add an evidence row for each.').toEqual([]);
  });
});
