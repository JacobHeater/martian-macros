import { describe, expect, it } from 'vitest';
import type { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { analyseFoodDay } from '../../src/engine/analysis/food/analyseFoodDay';
import { analyseFoodSpan } from '../../src/engine/analysis/food/analyseFoodSpan';
import { foodDaysOf } from '../../src/engine/analysis/food/foodDaysOf';
import { FoodSignalId } from '../../src/engine/analysis/food/FoodSignalId';
import { readFoodSignals } from '../../src/engine/analysis/food/readFoodSignals';
import { topContributors } from '../../src/engine/analysis/food/topContributors';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { CalorieBand } from '../../src/engine/CalorieBand';
import { foodFindingText } from '../../src/format/foodFindingText';
import { Fmt } from '../../src/format/Fmt';
import {
  type FixtureDay,
  food,
  fortnight,
  inputOf,
  ownersFatWeek,
  plainDay,
  safeguards,
  targets,
  today,
  yesterday,
} from './support/foodAnalysis';

/**
 * MM-606: what the coach reads in your food, over a span ending yesterday.
 * Each scenario of the ticket that the engine and its words answer.
 */
const fmt = new Fmt('metric');
const textOf = (f: CoachFinding) => foodFindingText(f, fmt);
const fixes = (found: readonly CoachFinding[]) => found.filter((f) => f.kind === 'fix');
const signals = (found: readonly CoachFinding[]) => found.map((f) => f.signal);
const composition = FoodSignalId.values.filter((id) => FoodSignalId.isComposition(id)) as readonly string[];

describe("the owner's fat week", () => {
  const found = analyseFoodSpan(inputOf(ownersFatWeek()), 14, yesterday);
  const calorieFamily = fixes(found).filter((f) => FoodSignalId.family(f.signal as FoodSignalId) === 'calories');

  it('one finding in the calorie family says fat averaged above target', () => {
    expect(calorieFamily).toHaveLength(1);
    const fat = calorieFamily[0] as CoachFinding;
    expect(fat.signal).toBe('fatAgainstTarget');
    expect(fat.figures['averageFatG']).toBeCloseTo(1262 / 14, 6);
    expect(fat.figures['targetFatG']).toBe(70);
    expect(fat.figures['highDays']).toBe(10);
  });

  it('names peanut butter and its share, and says protein was short', () => {
    const fat = calorieFamily[0] as CoachFinding;
    expect(fat.foods[0]).toMatchObject({ name: 'Peanut butter', days: 8 });
    expect(fat.foods[0]?.share).toBeCloseTo(272 / 1262, 6);
    expect(fat.figures['proteinReference']).toBe(0);
    const [, body] = textOf(fat);
    expect(body).toMatch(
      /^Fat averaged 90 g against 70 g; Peanut butter supplied 22% of it\. Fat carries 9 kcal a gram, so those calories went to fat instead of protein, which averaged 20 g under your minimum\./,
    );
  });

  it('carries a trade from MM-607', () => {
    const fat = calorieFamily[0] as CoachFinding;
    expect(fat.trade).toBeDefined();
    expect(fat.trade?.motive).toBe('fat');
    expect(fat.trade?.x.name).toBe('Peanut butter');
  });

  it('the protein minimum is a fix of its own, and the split is folded into the fat line', () => {
    expect(signals(fixes(found))).toContain('proteinMinimum');
    expect(signals(found)).not.toContain('macroSplit');
    expect(signals(found)).not.toContain('fatShare');
  });

  it('calories within the band hold up', () => {
    expect(found.find((f) => f.kind === 'holdingUp' && f.signal === 'calories')?.figures['withinDays']).toBe(14);
  });
});

it('fat over target that costs nothing is not a fix, and protein holds up', () => {
  // Fat at 1.3× its target every day, protein over the minimum on 12 of 14 days, calories within the band.
  const days = fortnight.map((date, i) => ({ date, entries: plainDay(date, 2380, i < 12 ? 172 : 130, 91) }));
  const found = analyseFoodSpan(inputOf(days), 14, yesterday);
  expect(signals(fixes(found)).filter((s) => ['fatAgainstTarget', 'fatShare', 'macroSplit'].includes(s))).toEqual([]);
  expect(found.some((f) => f.kind === 'holdingUp' && f.signal === 'proteinMinimum')).toBe(true);
});

describe('diffuse trends name no food', () => {
  it('a protein shortfall spread over foods of one day each names none, and offers no trade', () => {
    const days = fortnight.map((date) => ({ date, entries: plainDay(date, 2380, 110, 70) }));
    const minimum = analyseFoodSpan(inputOf(days), 14, yesterday).find((f) => f.signal === 'proteinMinimum');
    expect(minimum?.kind).toBe('fix');
    expect(minimum?.foods).toEqual([]);
    expect(minimum?.trade).toBeUndefined();
  });

  it('N11: none when the top 3 foods explain 20% of the gap', () => {
    // Fifteen foods, each a fifteenth of the total, each on three days.
    const entries = Array.from({ length: 15 }, (_, i) =>
      [0, 1, 2].map((d) => food(yesterday.addDays(-d), 'lunch', `Food ${i}`, 300, 5, 10)),
    ).flat();
    expect(topContributors(entries, (e) => e.kcal)).toEqual([]);
  });

  it('N11: a food giving half on 3 days or more is named; one on 2 days or under 15% is not', () => {
    const big = [0, 1, 2].map((d) => food(yesterday.addDays(-d), 'lunch', 'Granola', 400, 9, 18));
    const twoDays = [0, 1].map((d) => food(yesterday.addDays(-d), 'lunch', 'Cheese', 300, 18, 25));
    const small = [0, 1, 2].map((d) => food(yesterday.addDays(-d), 'dinner', 'Rice', 100, 2, 0));
    const rest = Array.from({ length: 6 }, (_, i) => food(yesterday.addDays(-i), 'snack', `Snack ${i}`, 50, 1, 1));
    const named = topContributors([...big, ...twoDays, ...small, ...rest], (e) => e.kcal);
    expect(named.map((f) => f.name)).toEqual(['Granola']);
    expect(named[0]).toMatchObject({ days: 3, kcal: 400, proteinG: 9 });
  });

  it('N11: a quick-add estimate or a drink mostly of alcohol is never named, but counts in the total', () => {
    const estimate = [0, 1, 2].map((d) => food(yesterday.addDays(-d), 'dinner', 'Takeaway', 900, 20, 40, { source: 'quickAdd' }));
    const wine = [0, 1, 2].map((d) => food(yesterday.addDays(-d), 'dinner', 'Wine', 250, 0, 0, { carbsG: 8, alcoholG: 30 }));
    const toast = [0, 1, 2].map((d) => food(yesterday.addDays(-d), 'breakfast', 'Toast', 600, 18, 8));
    const named = topContributors([...estimate, ...wine, ...toast], (e) => e.kcal);
    expect(named.map((f) => f.name)).toEqual(['Toast']);
    expect(named[0]?.share).toBeCloseTo(600 / 1750, 6);
  });
});

describe('data quality first', () => {
  it('6 of 14 days partial: the partial-days finding, and no composition finding', () => {
    const days = ownersFatWeek().map((d, i): FixtureDay => (i % 7 < 3 ? { ...d, completeness: 'partial' } : d));
    const found = analyseFoodSpan(inputOf(days), 14, yesterday);
    expect(found[0]).toMatchObject({ signal: 'partialDays', kind: 'dataQuality', figures: { loggedDays: 14, partialDays: 6 } });
    expect(signals(found).filter((s) => composition.includes(s))).toEqual([]);
  });

  it('calories mostly estimated: the estimates finding, and no composition finding', () => {
    const days = ownersFatWeek().map((d): FixtureDay => ({ ...d, estimatedShare: 0.6 }));
    const found = analyseFoodSpan(inputOf(days), 14, yesterday);
    expect(found[0]?.signal).toBe('estimatesRising');
    expect(signals(found).filter((s) => composition.includes(s))).toEqual([]);
  });
});

describe("each day's own targets", () => {
  // The minimum is 140 g for the first week and 100 g from the second; protein is 120 g every day.
  const changed = fortnight[7] as CalendarDate;
  const history = [targets(yesterday.addDays(-200)), targets(changed, { proteinMinimumG: 100, proteinG: 130 })];
  const days = fortnight.map((date) => ({ date, entries: plainDay(date, 2380, 120, 70) }));
  const input = inputOf(days, { history });

  it('every day is judged against the targets in force that day', () => {
    const readings = readFoodSignals({
      input,
      days: foodDaysOf(input, fortnight[0] as CalendarDate, yesterday),
      from: fortnight[0] as CalendarDate,
      to: yesterday,
      goal: 'fatLoss',
    });
    expect(readings.get('proteinMinimum')?.figures).toMatchObject({ judgedDays: 14, metDays: 7, minimumG: 120 });
  });

  it('so the minimum, met on half the days, is neither a fix nor holding up', () => {
    const found = analyseFoodSpan(input, 14, yesterday);
    expect(signals(found)).not.toContain('proteinMinimum');
  });

  it("a day's calories are read against its own planned target (MM-124)", () => {
    // A planned lower day at 70% of the flat target, eaten as planned.
    const planned = (date: CalendarDate) => (date.weekday === 0 ? 0.7 : 1);
    const shaped = fortnight.map((date) => ({ date, entries: plainDay(date, 2400 * planned(date), 150, 70) }));
    const found = analyseFoodSpan(inputOf(shaped, { plannedShare: planned }), 14, yesterday);
    expect(found.find((f) => f.signal === 'calories')).toMatchObject({ kind: 'holdingUp', figures: { withinDays: 14 } });
  });
});

describe('eating-disorder history', () => {
  it("with the owner's fat week, only the protein-minimum finding, naming no food", () => {
    const found = analyseFoodSpan(inputOf(ownersFatWeek(), { safeguards: safeguards({ eatingDisorderHistory: true }) }), 14, yesterday);
    expect(signals(found)).toEqual(['proteinMinimum']);
    expect(found[0]?.foods).toEqual([]);
    expect(found[0]?.trade).toBeUndefined();
  });

  it('the caution alone keeps it the same', () => {
    const found = analyseFoodSpan(
      inputOf(ownersFatWeek(), { safeguards: safeguards({ cautions: new Set(['eatingDisorderHistory']) }) }),
      14,
      yesterday,
    );
    expect(signals(found)).toEqual(['proteinMinimum']);
  });
});

it('under-eating: no fat, density or calorie finding, and a protein add may be', () => {
  const found = analyseFoodSpan(inputOf(ownersFatWeek(), { safeguards: safeguards({ underEating: true }) }), 14, yesterday);
  const allowed = ['proteinMinimum', 'proteinTarget', 'proteinByMeal', 'fiber', 'partialDays', 'estimatesRising', 'loggingStyle'];
  expect(signals(found).filter((s) => !allowed.includes(s))).toEqual([]);
  const minimum = found.find((f) => f.signal === 'proteinMinimum') as CoachFinding;
  expect(minimum.foods).toEqual([]);
  expect(textOf(minimum)[1]).toContain('Your calories have room for more of a protein food you log.');
});

describe('other safeguards', () => {
  const span = (overrides: Parameters<typeof safeguards>[0]) =>
    signals(analyseFoodSpan(inputOf(ownersFatWeek(), { safeguards: safeguards(overrides) }), 14, yesterday));

  it('bariatric surgery: nothing', () => {
    expect(span({ cautions: new Set(['bariatricSurgery']) })).toEqual([]);
  });

  it('pregnancy: no fat, density or calorie-lowering line', () => {
    const shown = span({ cautions: new Set(['pregnancy']) });
    expect(shown.filter((s) => ['fatAgainstTarget', 'fatShare', 'macroSplit', 'proteinDensity', 'calorieDensity', 'mealBalance'].includes(s))).toEqual([]);
    expect(shown).toContain('proteinMinimum');
  });

  it('kidney disease: no line for more protein', () => {
    const shown = span({ cautions: new Set(['chronicKidneyDisease']) });
    expect(shown.filter((s) => ['proteinMinimum', 'proteinTarget', 'proteinByMeal', 'proteinDensity', 'mealBalance'].includes(s))).toEqual([]);
  });

  it('under 18 or paused: adds only', () => {
    for (const overrides of [{ adult: false }, { paused: true }]) {
      expect(span(overrides).filter((s) => !['proteinMinimum', 'proteinTarget', 'proteinByMeal', 'fiber'].includes(s))).toEqual([]);
    }
  });
});

describe('lean gain under target', () => {
  // 2,400 kcal a day against 2,800, with potato chips (5.5 kcal a gram, little protein) every day.
  const leanGain = [targets(yesterday.addDays(-200), { mode: 'leanGain', kcal: 2800, fatG: 80, carbsG: 330 })];
  const chipsDays = (total: number) =>
    fortnight.map((date) => ({
      date,
      entries: [...plainDay(date, total - 330, 160, 60), food(date, 'snack', 'Potato chips', 330, 4, 21, { grams: 60 })],
    }));

  it('no density finding, and N14 suggests an add', () => {
    const found = analyseFoodSpan(inputOf(chipsDays(2400), { history: leanGain }), 14, yesterday);
    expect(signals(found)).not.toContain('calorieDensity');
    const calories = found.find((f) => f.signal === 'calories') as CoachFinding;
    expect(calories).toMatchObject({ kind: 'fix', figures: { direction: -1, belowDays: 14 } });
    expect(textOf(calories)[1]).toContain('more of a food you log would bring those days to target');
  });

  it('on fat loss, the same chips are a calorie-dense food, calorie-dense for its protein', () => {
    const found = analyseFoodSpan(inputOf(chipsDays(2400)), 14, yesterday);
    const dense = found.find((f) => f.signal === 'calorieDensity') as CoachFinding;
    expect(dense.kind).toBe('fix');
    expect(dense.foods[0]).toMatchObject({ name: 'Potato chips', days: 14 });
    expect(textOf(dense)[1]).toContain('It is calorie-dense for its protein.');
  });
});

describe('never praise under target (MM-92)', () => {
  // A small deterministic generator, so the simulated users are the same on every run.
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const goals: readonly GoalMode[] = ['fatLoss', 'recomp', 'leanGain', 'maintenance'];
  const praise = /deficit|weight|below the band|under the band|under your .*target|under target/i;

  it('no "holding up" finding mentions calories below the band, a deficit or weight down, for any user or day', () => {
    for (let user = 0; user < 40; user++) {
      const goal = goals[user % goals.length] as GoalMode;
      const level = 0.6 + 0.7 * random();
      const kcalTarget = 2000 + Math.round(800 * random());
      const history = [targets(yesterday.addDays(-200), { mode: goal, kcal: kcalTarget })];
      const days = Array.from({ length: 30 }, (_, i) => {
        const date = yesterday.addDays(i - 29);
        const kcal = kcalTarget * level * (0.85 + 0.3 * random());
        return { date, entries: plainDay(date, kcal, 80 + 120 * random(), 40 + 70 * random()) };
      });
      const todays = { date: today, entries: plainDay(today, kcalTarget * level, 150, 70) };
      const input = inputOf([...days, todays], { history });
      const found = [
        ...analyseFoodSpan(input, 7, yesterday),
        ...analyseFoodSpan(input, 14, yesterday),
        ...analyseFoodSpan(input, 30, yesterday),
        ...analyseFoodDay(input, today),
      ];
      for (const f of found.filter((x) => x.kind === 'holdingUp')) {
        const [title, body] = textOf(f);
        expect(`${title} ${body}`).not.toMatch(praise);
        if (f.signal !== 'calories') continue;
        if (f.span === 1) {
          expect(new CalorieBand(kcalTarget).contains(f.figures['kcal'] ?? 0)).toBe(true);
        } else {
          expect((f.figures['withinDays'] ?? 0) / (f.figures['judgedDays'] ?? 1)).toBeGreaterThanOrEqual(0.7);
        }
      }
    }
  });
});
