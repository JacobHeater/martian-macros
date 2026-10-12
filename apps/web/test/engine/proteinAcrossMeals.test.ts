import { describe, expect, it } from 'vitest';
import { CalendarDate, IntakeDay, Meal, type WeightObservation } from '../../src/domain';
import { DailyTargets, findInsights, type Insight, mealHasSolidProtein, TargetsRecord } from '../../src/engine';
import { upTo } from '../support/upTo';

/** MM-125: how protein is spread across the day, without a lecture. */
const through = CalendarDate.of(2026, 3, 14);

const targets = new TargetsRecord({
  effectiveFrom: through.addDays(-60),
  mode: 'fatLoss',
  tdeeKcal: 2700,
  tdeeSigmaKcal: 200,
  tdeeStatus: 'updated',
  targets: new DailyTargets({
    kcal: 2100,
    proteinG: 160,
    proteinMinimumG: 130,
    fatG: 70,
    carbsG: 220,
    weeklyRateFraction: -0.005,
  }),
});

const day = (daysAgo: number, protein: number) =>
  new IntakeDay({
    date: through.addDays(-daysAgo),
    kcal: 2100,
    proteinG: protein,
    carbsG: 200,
    fatG: 70,
    completeness: 'complete',
  });

const meals = ({
  breakfast = 30,
  lunch = 30,
  dinner = 30,
  snack = 0,
}: { breakfast?: number; lunch?: number; dinner?: number; snack?: number } = {}) =>
  new Map<Meal, number>([
    ['breakfast', breakfast],
    ['lunch', lunch],
    ['dinner', dinner],
    ['snack', snack],
  ]);

/** The meals of each of the last `count` days, the day given as days ago. */
const mealsFor = (count: number, of: (daysAgo: number) => Map<Meal, number>) =>
  new Map(upTo(count).map((i) => [through.addDays(-i), of(i)]));

const fortnight = (protein: number) => upTo(14).map((i) => day(i, protein));

const weights: WeightObservation[] = [
  ...upTo(14).map((i) => ({ date: through.addDays(-i), weightKg: 85 })),
  { date: through.addDays(-40), weightKg: 86 },
];

const find = ({
  intake,
  mealProtein,
}: {
  intake: IntakeDay[];
  mealProtein: ReadonlyMap<CalendarDate, ReadonlyMap<Meal, number>>;
}) => findInsights({ through, intake, weights, history: [targets], mealProtein });

const byMeal = (all: readonly Insight[]) => all.find((i) => i.rule === 'proteinByMeal');

describe('the marker', () => {
  it('an 80 kg person with 30 g at lunch has it', () => {
    expect(mealHasSolidProtein({ proteinG: 30, weightKg: 80 })).toBe(true);
  });

  it('23 g does not, and that says nothing', () => {
    expect(mealHasSolidProtein({ proteinG: 23, weightKg: 80 })).toBe(false);
  });

  it('with no weight known there is no marker', () => {
    expect(mealHasSolidProtein({ proteinG: 60, weightKg: 0 })).toBe(false);
  });
});

describe('the insight', () => {
  it('under the minimum on 10 of 14 days, breakfast almost empty', () => {
    const found = byMeal(
      find({
        intake: [...upTo(10).map((i) => day(i, 95)), ...upTo(4).map((i) => day(i + 10, 150))],
        mealProtein: mealsFor(14, (i) =>
          i < 10 ? meals({ breakfast: i < 8 ? 5 : 25, lunch: 40, dinner: 50 }) : meals(),
        ),
      }),
    );
    expect(found?.figures['meal']).toBe(Meal.values.indexOf('breakfast'));
    expect(found?.figures['missedDays']).toBe(10);
    expect(found?.figures['lowDays']).toBe(8);
  });

  it('names lunch when lunch is the empty one', () => {
    const found = byMeal(
      find({
        intake: fortnight(95),
        mealProtein: mealsFor(14, () => meals({ breakfast: 35, lunch: 4, dinner: 56 })),
      }),
    );
    expect(found?.figures['meal']).toBe(Meal.values.indexOf('lunch'));
  });

  it('meeting protein with 120 g at dinner never brings it', () => {
    expect(
      byMeal(
        find({
          intake: fortnight(140),
          mealProtein: mealsFor(14, () => meals({ breakfast: 0, lunch: 20, dinner: 120 })),
        }),
      ),
    ).toBeUndefined();
  });

  it('missing protein with every meal carrying some brings none', () => {
    expect(byMeal(find({ intake: fortnight(90), mealProtein: mealsFor(14, () => meals()) }))).toBeUndefined();
  });

  it('an empty meal on a few of the missed days is not a pattern', () => {
    expect(
      byMeal(
        find({
          intake: fortnight(95),
          mealProtein: mealsFor(14, (i) => meals({ breakfast: i < 5 ? 0 : 30 })),
        }),
      ),
    ).toBeUndefined();
  });

  it('with no meals known it says nothing', () => {
    expect(byMeal(find({ intake: fortnight(95), mealProtein: new Map() }))).toBeUndefined();
  });

  it('snacks are never the meal named', () => {
    expect(
      byMeal(find({ intake: fortnight(95), mealProtein: mealsFor(14, () => meals({ snack: 0 })) })),
    ).toBeUndefined();
  });

  it('it ranks below every other rule', () => {
    const all = find({ intake: fortnight(95), mealProtein: mealsFor(14, () => meals({ breakfast: 0 })) });
    expect(all[all.length - 1]?.rule).toBe('proteinByMeal');
    const rules = all.map((i) => i.rule);
    expect(rules).toContain('proteinShort');
    expect(rules).toContain('proteinByMeal');
  });
});
