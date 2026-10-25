import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { analyseTrainingSpan } from '../../src/engine/analysis/analyseTrainingSpan';
import { arrangeCoachFindings } from '../../src/engine/analysis/arrangeCoachFindings';
import type { CoachAdvice } from '../../src/engine/analysis/CoachAdvice';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import { analyseFoodSpan } from '../../src/engine/analysis/food/analyseFoodSpan';
import { dominantDayAdviceOf } from '../../src/engine/analysis/food/dominantDayAdviceOf';
import type { FoodDay } from '../../src/engine/analysis/food/FoodDay';
import { mealBreakdownOf } from '../../src/engine/analysis/food/mealBreakdownOf';
import { TrendSpan } from '../../src/engine/trends/TrendSpan';
import { buffetDayEntries, buffetDayInput, buffetDayMinute } from './support/buffetDay';
import { food, inputOf, intakeOf, ownersFatWeek, targets, today, yesterday } from './support/foodAnalysis';
import { stationaryCoachUser } from './support/stationaryCoachUser';

/**
 * MM-617's advice data: every fix ends in an order, and the owner's buffet
 * day gives the orders of the voice standard, line by line. The words are
 * `format/`'s; this reads the data they are built from.
 */
const analysed = (overrides: Parameters<typeof buffetDayInput>[0] = {}) =>
  analyseFoodDay(buffetDayInput(overrides), today, { nowMinute: buffetDayMinute });
const fixOf = (found: readonly CoachFinding[], signal: string) =>
  found.find((f) => f.kind === 'fix' && f.signal === signal) as CoachFinding;
const ordersOf = (f: CoachFinding | undefined, kind: CoachAdvice['kind']) => (f?.advice ?? []).filter((a) => a.kind === kind);

describe("the owner's buffet day", () => {
  const found = analysed();
  const sections = arrangeCoachFindings(found, { today });
  const calories = fixOf(found, 'fatAgainstTarget');

  it('the fixture is the day the owner logged: 3,229 kcal, 155 g protein, 159 g fat, 6,923 mg sodium, 14 g fiber', () => {
    const left = found.find((f) => f.kind === 'left');
    expect(left?.figures).toMatchObject({ kcal: 3229, kcalTarget: 2175, kcalLeft: -1054 });
    expect(left?.figures['proteinG']).toBeCloseTo(155, 6);
    expect(left?.figures['fatG']).toBeCloseTo(159, 6);
    expect(fixOf(found, 'sodium').figures).toMatchObject({ sodiumMg: 6923, limitMg: 1800 });
    expect(fixOf(found, 'fiber').figures['fiberG']).toBeCloseTo(14, 6);
  });

  it('the headline: 1,054 kcal over, and the buffet did it', () => {
    expect(sections.verdict).toMatchObject({
      kind: 'over',
      overKcal: 1054,
      targetKcal: 2175,
      cause: { meal: 'lunch', mealName: 'Chinese buffet', mealKcal: 2368, mealFoods: 13, food: { name: "General Tso's chicken" } },
    });
  });

  it('lunch was the problem: the buffet, 13 foods and 2,368 kcal, taken apart from its logged meal', () => {
    const breakdown = mealBreakdownOf(buffetDayEntries(), (100 * 187) / 2175);
    expect(breakdown).toMatchObject({ meal: 'lunch', name: 'Chinese buffet', kcal: 2368 });
    expect(breakdown?.entries).toHaveLength(13);
    expect(breakdown?.worst.map((e) => e.name)).toEqual(["General Tso's chicken"]);
    expect(breakdown?.keep?.name).toBe('Steamed chicken with vegetables');
    expect(calories.cause).toMatchObject({ meal: 'lunch', mealName: 'Chinese buffet', mealKcal: 2368 });
  });

  it("General Tso's chicken was the worst: skip it or take one spoonful, fill the plate with the steamed chicken, and 310 over without it", () => {
    const [skip] = ordersOf(calories, 'skip');
    expect(skip).toMatchObject({
      food: { name: "General Tso's chicken", kcal: 744, fatG: 33, proteinG: 32 },
      meal: 'lunch',
      mealName: 'Chinese buffet',
      orOneSpoonful: true,
      keepFood: 'Steamed chicken with vegetables',
      overKcal: 1054,
      withoutKcalOver: 310,
    });
    expect(calories.advice?.[0]).toBe(skip);
  });

  it("the rest of today: done eating; dinner, if hungry, under 400 kcal, and no sauce after the day's sauced and fried food", () => {
    const left = found.find((f) => f.kind === 'left');
    expect(left?.advice).toEqual([{ kind: 'limitRestOfDay', limitKcal: 400, meal: 'dinner', noSauce: true }]);
  });

  it("sodium 3.8× the limit: General Tso's chicken did it; drink water, and sauce on the side next time", () => {
    const sodium = fixOf(found, 'sodium');
    expect(sodium.figures['sodiumMultiple']).toBeCloseTo(6923 / 1800, 6);
    expect(sodium.foods.map((f) => f.name)).toEqual(["General Tso's chicken"]);
    expect(sodium.advice?.map((a) => a.kind)).toEqual(['drinkWater', 'sauceOnSide']);
    expect(ordersOf(sodium, 'drinkWater')[0]?.sodiumMultiple).toBeCloseTo(3.846, 3);
  });

  it('breakfast: the sausage, egg and cheese biscuit is swapped for something that replaces it', () => {
    const protein = fixOf(found, 'proteinDensity');
    const swap = ordersOf(protein, 'swap').find((a) => a.food?.name === 'Sausage egg and cheese biscuit with extra eggs');
    expect(swap).toMatchObject({ food: { kcal: 691, fatG: 45, proteinG: 31, meal: true }, meal: 'breakfast' });
    expect(swap?.replacement).toBeDefined();
    const kcal = swap?.replacement?.kcal;
    if (kcal !== undefined) expect(kcal).toBeLessThan(691);
  });

  it('fiber 14 g of 30 by the evening: two cups of vegetables at dinner', () => {
    const fiber = fixOf(found, 'fiber');
    expect(fiber.figures['guideG']).toBeCloseTo(30.45, 2);
    expect(fiber.advice).toEqual([{ kind: 'add', nutrient: 'fiber', addCategory: 'vegetables', amountCups: 2, meal: 'dinner' }]);
  });

  it('cookie butter: 170 kcal and 1 g protein does nothing for your goal, so skip it', () => {
    const skip = ordersOf(fixOf(found, 'proteinDensity'), 'skip').find((a) => a.food?.name === 'COOKIE BUTTER, CRUNCHY (LOTUS)');
    expect(skip).toMatchObject({ food: { kcal: 170, proteinG: 1 }, lowProtein: true, meal: 'snack' });
  });

  it('protein 155 g: the minimum hit, said as holding up', () => {
    expect(found.find((f) => f.kind === 'holdingUp' && f.signal === 'proteinMinimum')?.figures).toMatchObject({ proteinG: 155, minimumG: 149 });
  });

  it("tomorrow: back to 2,175, the day's last line", () => {
    const close = found.at(-1);
    expect(close).toMatchObject({ kind: 'close', signal: 'backToPlan', figures: { overKcal: 1054, overBand: 1 } });
    expect(close?.advice).toEqual([{ kind: 'backToPlan', limitKcal: 2175 }]);
    expect(sections.close).toBe(close);
  });

  it('every fix ends in an order', () => {
    const fixes = found.filter((f) => f.kind === 'fix');
    expect(fixes.map((f) => f.signal).sort()).toEqual(['fatAgainstTarget', 'fiber', 'proteinDensity', 'sodium']);
    for (const f of fixes) expect(f.advice?.length ?? 0, f.signal).toBeGreaterThan(0);
  });

  it('before the evening, with no dinner logged, fiber is not yet a fix', () => {
    const early = analyseFoodDay(buffetDayInput(), today, { nowMinute: 15 * 60 });
    expect(early.some((f) => f.kind === 'fix' && f.signal === 'fiber')).toBe(false);
  });

  it('with dinner logged, the rest of today is a snack under 200 kcal', () => {
    const entries = [...buffetDayEntries(), food(today, 'dinner', 'Grilled chicken salad', 350, 40, 12)];
    const input = { ...buffetDayInput(), entries, intake: [] };
    const left = analyseFoodDay(input, today).find((f) => f.kind === 'left');
    expect(left?.advice).toEqual([{ kind: 'limitRestOfDay', limitKcal: 200, meal: 'snack', noSauce: true }]);
  });
});

describe('safety holds on the buffet day', () => {
  const eatLess: readonly CoachAdvice['kind'][] = ['skip', 'halve', 'swap', 'limitRestOfDay', 'backToPlan', 'sauceOnSide', 'drinkWater'];

  it('an eating-disorder history: protein lines only, and no skip, limit, swap or eat-less order', () => {
    const found = analysed({ eatingDisorderHistory: true });
    expect(found.map((f) => f.signal).filter((s) => s !== 'proteinMinimum' && s !== 'left')).toEqual([]);
    expect(found.filter((f) => f.kind === 'fix')).toEqual([]);
    const orders = found.flatMap((f) => f.advice ?? []);
    for (const a of orders) {
      expect(eatLess).not.toContain(a.kind);
      expect(a).toMatchObject({ kind: 'add', nutrient: 'protein' });
      expect(a.food).toBeUndefined();
      expect(a.addFood).toBeUndefined();
    }
    for (const f of found) expect(f.cause).toBeUndefined();
    expect(arrangeCoachFindings(found, { today }).verdict?.kind).not.toBe('over');
  });

  it('pregnancy: no skip, halve, limit or swap to fewer calories, and every fix still ends in an order', () => {
    const found = analysed({ cautions: new Set(['pregnancy'] as const) });
    const orders = found.flatMap((f) => f.advice ?? []);
    expect(orders.filter((a) => a.kind === 'skip' || a.kind === 'halve' || a.kind === 'limitRestOfDay')).toEqual([]);
    for (const a of orders.filter((o) => o.kind === 'swap')) expect(a.replacement?.kcal ?? 0).toBeGreaterThanOrEqual(a.food?.kcal ?? 0);
    for (const f of found.filter((x) => x.kind === 'fix')) expect(f.advice?.length ?? 0, f.signal).toBeGreaterThan(0);
  });

  it('the under-eating finding: adds only', () => {
    const orders = analysed({ underEating: true }).flatMap((f) => f.advice ?? []);
    for (const a of orders) expect(a.kind).toBe('add');
  });
});

describe('without it', () => {
  it('a day 1,054 kcal over where one food gave 744 kcal is 310 over without it', () => {
    const skip = ordersOf(fixOf(analysed(), 'fatAgainstTarget'), 'skip')[0];
    expect((skip?.overKcal ?? 0) - (skip?.food?.kcal ?? 0)).toBe(310);
    expect(skip?.withoutKcalOver).toBe(310);
  });
});

describe('a span driven by one day', () => {
  // Fat loss at 2,400 kcal: thirteen days at target, and one day 2,000 over with a buffet lunch of three foods.
  const record = targets(yesterday.addDays(-200));
  const tag = { key: 'buffet', name: 'Buffet' };
  const binge = yesterday.addDays(-3);
  const dayOf = (date: CalendarDate, entries: ReturnType<typeof food>[]): FoodDay => ({
    date,
    entries,
    intake: intakeOf(date, entries),
    whole: true,
    record,
    kcalTarget: 2400,
    kind: 'none',
  });
  const ordinary = (date: CalendarDate) =>
    dayOf(date, [food(date, 'breakfast', 'Oats and whey', 600, 45, 18), food(date, 'lunch', 'Chicken wrap', 800, 55, 25), food(date, 'dinner', 'Salmon and rice', 1050, 60, 27)]);
  const days = Array.from({ length: 14 }, (_, i) => yesterday.addDays(i - 13)).map((date) =>
    date === binge
      ? dayOf(date, [
          food(date, 'breakfast', 'Oats and whey', 600, 45, 18),
          food(date, 'lunch', 'Fried chicken', 1500, 60, 90, { loggedMeal: tag }),
          food(date, 'lunch', 'Mac and cheese', 600, 20, 30, { loggedMeal: tag }),
          food(date, 'lunch', 'Grilled salmon', 300, 35, 15, { loggedMeal: tag }),
          food(date, 'dinner', 'Chicken and rice', 1400, 90, 30),
        ])
      : ordinary(date),
  );

  it("names that day, its meal and its worst food, and what the day would have been without it", () => {
    const driven = dominantDayAdviceOf(days);
    expect(driven?.cause).toMatchObject({ on: binge, meal: 'lunch', mealName: 'Buffet', mealKcal: 2400, mealFoods: 3, food: { name: 'Fried chicken' } });
    expect(driven?.advice[0]).toMatchObject({
      kind: 'skip',
      on: binge,
      meal: 'lunch',
      mealName: 'Buffet',
      food: { name: 'Fried chicken', kcal: 1500 },
      overKcal: 2000,
      withoutKcalOver: 500,
      keepFood: 'Grilled salmon',
      orOneSpoonful: true,
    });
  });

  it('no one day drives a span whose days over are spread', () => {
    const spread = days.map((d, i) => (i % 2 === 0 ? dayOf(d.date, [food(d.date, 'dinner', `Dinner ${i}`, 2900, 120, 90)]) : d));
    expect(dominantDayAdviceOf(spread.map((d) => (d.date === binge ? ordinary(d.date) : d)))).toBeUndefined();
  });
});

describe('every fix has an order', () => {
  const start = CalendarDate.of(2026, 1, 5);
  const days = 150;
  const users = 12;
  const lacking = (findings: readonly CoachFinding[]) =>
    findings.filter((f) => f.kind === 'fix' && (f.advice ?? []).length === 0).map((f) => `${f.span} ${f.signal} ${f.to.toString()}`);

  it('over the stationary simulated users, on 1d and every span, for food and training', () => {
    const missing: string[] = [];
    let fixes = 0;
    for (let user = 0; user < users; user++) {
      const person = stationaryCoachUser(7100 + user, start, days);
      for (let i = 100; i < days; i += 7) {
        const asOf = start.addDays(i);
        const day = analyseFoodDay(person.food, asOf.addDays(1), { nowMinute: 20 * 60 });
        const spans = TrendSpan.values.flatMap((span) => [
          ...analyseFoodSpan(person.food, span, asOf),
          ...analyseTrainingSpan(person.training(asOf), span, asOf),
        ]);
        const all = [...day, ...spans];
        fixes += all.filter((f) => f.kind === 'fix').length;
        missing.push(...lacking(all));
      }
    }
    expect(fixes).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  }, 300_000);

  it("on the owner's fat week, and on a day of it with peanut butter", () => {
    const input = inputOf([...ownersFatWeek(), { date: today, entries: [food(today, 'breakfast', 'Peanut butter', 400, 14, 34)] }]);
    const found = [...TrendSpan.values.flatMap((span) => analyseFoodSpan(input, span, yesterday)), ...analyseFoodDay(input, today)];
    expect(found.some((f) => f.kind === 'fix')).toBe(true);
    expect(lacking(found)).toEqual([]);
  });
});
