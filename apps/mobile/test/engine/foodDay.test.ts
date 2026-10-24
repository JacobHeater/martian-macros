import { describe, expect, it } from 'vitest';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import { analyseFoodSpan } from '../../src/engine/analysis/food/analyseFoodSpan';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { foodFindingText } from '../../src/format/foodFindingText';
import { Fmt } from '../../src/format/Fmt';
import { food, inputOf, safeguards, targets, today, yesterday } from './support/foodAnalysis';

/**
 * MM-612: the 1d analysis, today as logged so far, from the first entry.
 * Each scenario of the ticket that the engine and its words answer.
 */
const fmt = new Fmt('metric');
const textOf = (f: CoachFinding) => foodFindingText(f, fmt);
const allText = (found: readonly CoachFinding[]) =>
  found.map((f) => {
    const [title, body, evidence] = textOf(f);
    return [title, body, ...evidence.flat()].join(' ');
  });

/** A new user whose only entries are today's lunch: 780 kcal with 18 g protein, mostly cheese and crackers. */
const firstLunch = () => [
  food(today, 'lunch', 'Cheese and crackers', 520, 14, 34),
  food(today, 'lunch', 'Apple juice', 260, 4, 0),
];
const newUser = (overrides: Parameters<typeof inputOf>[1] = {}) =>
  inputOf([{ date: today, entries: firstLunch() }], { history: [targets(today)], ...overrides });

describe('today analysed from the first entry', () => {
  const found = analyseFoodDay(newUser(), today);

  it('is the 1d analysis of today, and names the cheese and crackers', () => {
    expect(found.length).toBeGreaterThan(0);
    for (const f of found) expect(f).toMatchObject({ span: 1, from: today, to: today, trend: undefined });
    const density = found.find((f) => f.kind === 'fix' && f.signal === 'proteinDensity') as CoachFinding;
    expect(density.figures).toMatchObject({ kcal: 780, proteinG: 18 });
    expect(density.foods[0]?.name).toBe('Cheese and crackers');
    expect(textOf(density)[1]).toContain('Cheese and crackers (61%)');
  });

  it('nothing waits on days of history: a span has nothing to say yet', () => {
    expect(analyseFoodSpan(newUser(), 7, yesterday)).toEqual([]);
  });

  it('a trade is offered when one qualifies, and none when it does not', () => {
    const density = found.find((f) => f.signal === 'proteinDensity');
    // No other food was ever logged, so no Y can qualify.
    expect(density?.trade).toBeUndefined();
  });
});

describe('what is left', () => {
  // Today: 1,790 kcal with 108 g protein, against 2,400 kcal and 170 g. Chicken and rice was logged as a meal on 2 days.
  const meal = (date: typeof today, key: string) => [
    food(date, 'dinner', 'Chicken breast', 280, 40, 6, { loggedMeal: { key, name: 'Chicken and rice' } }),
    food(date, 'dinner', 'Rice', 240, 8, 1, { loggedMeal: { key, name: 'Chicken and rice' } }),
  ];
  const todays = [
    food(today, 'breakfast', 'Porridge', 590, 28, 14),
    food(today, 'lunch', 'Salmon wrap', 800, 50, 30),
    food(today, 'snack', 'Apple', 100, 0, 0),
    food(today, 'snack', 'Yogurt', 300, 30, 8),
  ];
  const input = inputOf([
    { date: yesterday.addDays(-6), entries: meal(yesterday.addDays(-6), 'a') },
    { date: yesterday.addDays(-2), entries: meal(yesterday.addDays(-2), 'b') },
    { date: today, entries: todays },
  ]);
  const left = analyseFoodDay(input, today).find((f) => f.kind === 'left') as CoachFinding;

  it('states the calories and protein left today', () => {
    expect(left.figures).toMatchObject({ kcalLeft: 610, proteinLeftG: 62, kcalTarget: 2400, proteinTargetG: 170 });
  });

  it('and names the logged meal that fits', () => {
    expect(left.foods).toEqual([expect.objectContaining({ name: 'Chicken and rice', kcal: 520, proteinG: 48, days: 2 })]);
    expect(textOf(left)[1]).toBe('62 g protein and 610 kcal left today. Your usual Chicken and rice (48 g, 520 kcal) fits.');
  });
});

it('updates with each entry', () => {
  const first = firstLunch();
  const later = [...first, food(today, 'dinner', 'Chicken breast', 400, 60, 8)];
  const before = analyseFoodDay(inputOf([{ date: today, entries: first }]), today).find((f) => f.kind === 'left');
  const after = analyseFoodDay(inputOf([{ date: today, entries: later }]), today).find((f) => f.kind === 'left');
  expect(before?.figures['kcal']).toBe(780);
  expect(after?.figures['kcal']).toBe(1180);
  expect(after?.figures['proteinLeftG']).toBe(170 - 78);
});

it('a marked day shows its totals and what is left, and no fix', () => {
  // Fat at twice its 70 g target on a Refeed.
  const entries = [food(today, 'dinner', 'Pizza', 1800, 60, 100), food(today, 'lunch', 'Fries', 600, 6, 40)];
  const found = analyseFoodDay(inputOf([{ date: today, entries, kind: 'refeed' }]), today);
  expect(found.map((f) => f.kind)).toEqual(['left']);
  expect(found[0]?.figures).toMatchObject({ marked: 1, kcal: 2400, fatG: 140 });
  const [title, body] = textOf(found[0] as CoachFinding);
  expect(title).toBe('Refeed today: 2,400 kcal so far');
  expect(body).toMatch(/^Logged so far: 2,400 kcal, 66 g protein, \d+ g carbohydrate and 140 g fat\./);
});

it('never compensation: yesterday 800 kcal over is never mentioned, and today keeps its targets', () => {
  const input = inputOf([
    { date: yesterday, entries: [food(yesterday, 'dinner', 'Feast', 3200, 120, 150)] },
    { date: today, entries: [food(today, 'breakfast', 'Eggs on toast', 500, 30, 22)] },
  ]);
  const found = analyseFoodDay(input, today);
  expect(found.length).toBeGreaterThan(0);
  for (const f of found) expect(f.from).toBe(today);
  for (const text of allText(found)) {
    expect(text).not.toMatch(/yesterday|Feast|earlier|tomorrow|less|make up/i);
    expect(text).not.toContain(Fmt.shortDay(yesterday));
  }
  expect(found.find((f) => f.kind === 'left')?.figures).toMatchObject({ kcalTarget: 2400, kcalLeft: 1900 });
});

it('eating-disorder history: at most protein lines, with no food named', () => {
  const input = inputOf([{ date: today, entries: [food(today, 'lunch', 'Cheese and crackers', 1200, 20, 95)] }], {
    safeguards: safeguards({ eatingDisorderHistory: true }),
  });
  const found = analyseFoodDay(input, today);
  expect(found.map((f) => f.signal).filter((s) => s !== 'proteinMinimum' && s !== 'left')).toEqual([]);
  for (const f of found) {
    expect(f.foods).toEqual([]);
    expect(f.trade).toBeUndefined();
  }
  for (const text of allText(found)) {
    expect(text).not.toMatch(/kcal|calorie|fat|Cheese/i);
  }
});

it('holding up: today at the protein minimum and within the calorie band, in numbers', () => {
  const entries = [
    food(today, 'breakfast', 'Oats and whey', 600, 45, 12),
    food(today, 'lunch', 'Chicken salad', 800, 55, 30),
    food(today, 'dinner', 'Salmon and potatoes', 1000, 52, 34),
  ];
  const found = analyseFoodDay(inputOf([{ date: today, entries }]), today);
  const protein = found.find((f) => f.kind === 'holdingUp' && f.signal === 'proteinMinimum') as CoachFinding;
  const calories = found.find((f) => f.kind === 'holdingUp' && f.signal === 'calories') as CoachFinding;
  expect(textOf(protein)[0]).toBe('Protein 152 g, over your 140 g minimum');
  expect(textOf(calories)[0]).toBe("2,400 kcal, within your target's band");
});

describe('safeguards on 1d', () => {
  const lunch = () => [{ date: today, entries: [food(today, 'lunch', 'Cheese and crackers', 1200, 20, 95)] }];

  it('under 18, paused or bariatric surgery: nothing', () => {
    for (const overrides of [{ adult: false }, { paused: true }, { cautions: new Set(['bariatricSurgery'] as const) }]) {
      expect(analyseFoodDay(inputOf(lunch(), { safeguards: safeguards(overrides) }), today)).toEqual([]);
    }
  });

  it('the under-eating finding: no line that lowers intake, and what is left', () => {
    const found = analyseFoodDay(inputOf(lunch(), { safeguards: safeguards({ underEating: true }) }), today);
    expect(found.filter((f) => f.kind === 'fix')).toEqual([]);
    expect(found.some((f) => f.kind === 'left')).toBe(true);
  });

  it('without them, the same fat-heavy lunch is a fat line and a density line, each naming the food', () => {
    const found = analyseFoodDay(inputOf(lunch()), today);
    const fat = found.find((f) => f.signal === 'fatAgainstTarget') as CoachFinding;
    expect(fat).toMatchObject({ kind: 'fix', figures: { fatG: 95, targetFatG: 70, densityLow: 1 } });
    expect(fat.foods[0]?.name).toBe('Cheese and crackers');
    expect(textOf(fat)[1]).toMatch(/^Fat today is 95 g against 70 g; Cheese and crackers supplied 100% of it\. Fat carries 9 kcal a gram/);
    expect(found.find((f) => f.signal === 'proteinDensity')?.foods[0]?.name).toBe('Cheese and crackers');
  });
});
