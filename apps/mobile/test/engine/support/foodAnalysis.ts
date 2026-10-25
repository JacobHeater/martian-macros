import { CalendarDate } from '../../../src/domain/CalendarDate';
import type { DayCompleteness } from '../../../src/domain/DayCompleteness';
import type { DayKind } from '../../../src/domain/DayKind';
import { NutritionTotals } from '../../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../../src/domain/FoodEntry';
import { IntakeDay } from '../../../src/domain/IntakeDay';
import type { Meal } from '../../../src/domain/Meal';
import type { QuantitySource } from '../../../src/domain/QuantitySource';
import type { FoodAnalysisInput } from '../../../src/engine/analysis/food/FoodAnalysisInput';
import type { InsightSafeguards } from '../../../src/engine/InsightSafeguards';
import type { TargetsRecord } from '../../../src/engine/TargetsRecord';
import { targetsFrom } from '../../support/targetsFrom';

/** The food analysis's fixtures (MM-606, MM-612): days built from entries, so the foods and the totals agree. */

export const yesterday = CalendarDate.of(2026, 10, 23);
export const today = yesterday.addDays(1);

/** The ordinary targets: 2,400 kcal, protein 170 g with a 140 g minimum, fat 70 g, carbohydrate 250 g. */
export const targets = (from: CalendarDate, overrides: Parameters<typeof targetsFrom>[1] = {}): TargetsRecord =>
  targetsFrom(from, { kcal: 2400, proteinG: 170, proteinMinimumG: 140, fatG: 70, carbsG: 250, ...overrides });

let nextId = 1;

/** One food, its carbohydrate given or the calories its protein and fat leave. */
export function food(
  date: CalendarDate,
  meal: Meal,
  name: string,
  kcal: number,
  proteinG: number,
  fatG: number,
  {
    carbsG = Math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4),
    grams,
    source = 'labelServing',
    fiberG,
    sodiumMg,
    alcoholG,
    loggedMeal,
  }: {
    carbsG?: number;
    grams?: number;
    source?: QuantitySource;
    fiberG?: number;
    sodiumMg?: number;
    alcoholG?: number;
    loggedMeal?: { key: string; name: string };
  } = {},
): FoodEntry {
  return new FoodEntry({
    id: nextId++,
    date,
    meal,
    name,
    kcal,
    proteinG,
    carbsG,
    fatG,
    source,
    fiberG,
    sodiumMg,
    alcoholG,
    loggedMeal,
    portion:
      grams === undefined
        ? undefined
        : {
            method: source,
            basis: 'calculated',
            quantity: grams,
            unit: 'gram',
            reference: {
              basis: 'per100g',
              nutrition: new NutritionTotals({
                kcal: (100 * kcal) / grams,
                proteinG: (100 * proteinG) / grams,
                carbsG: (100 * carbsG) / grams,
                fatG: (100 * fatG) / grams,
              }),
            },
          },
  });
}

/** A day's totals from its entries. */
export function intakeOf(
  date: CalendarDate,
  entries: readonly FoodEntry[],
  { completeness = 'complete', estimatedShare = 0 }: { completeness?: DayCompleteness; estimatedShare?: number } = {},
): IntakeDay {
  const sum = (of: (e: FoodEntry) => number) => entries.reduce((s, e) => s + of(e), 0);
  return new IntakeDay({
    date,
    kcal: sum((e) => e.kcal),
    proteinG: sum((e) => e.proteinG),
    carbsG: sum((e) => e.carbsG),
    fatG: sum((e) => e.fatG),
    completeness,
    estimatedShare,
  });
}

/** Safeguards that allow everything, unless overridden. */
export function safeguards(overrides: Partial<InsightSafeguards> = {}): InsightSafeguards {
  return {
    adult: true,
    eatingDisorderHistory: false,
    weightHidden: false,
    paused: false,
    underEating: false,
    cautions: new Set(),
    ...overrides,
  };
}

/** A day of the analysis: its entries, and how it was marked. */
export interface FixtureDay {
  readonly date: CalendarDate;
  readonly entries: readonly FoodEntry[];
  readonly completeness?: DayCompleteness;
  readonly estimatedShare?: number;
  readonly kind?: DayKind;
}

/** The analysis's input from fixture days, with the ordinary targets from long before unless `history` is given. */
export function inputOf(days: readonly FixtureDay[], overrides: Partial<FoodAnalysisInput> = {}): FoodAnalysisInput {
  return {
    entries: days.flatMap((d) => d.entries),
    intake: days.map((d) =>
      intakeOf(d.date, d.entries, {
        ...(d.completeness === undefined ? {} : { completeness: d.completeness }),
        ...(d.estimatedShare === undefined ? {} : { estimatedShare: d.estimatedShare }),
      }),
    ),
    history: [targets(yesterday.addDays(-200))],
    safeguards: safeguards(),
    markedDays: new Map(days.flatMap((d) => (d.kind === undefined || d.kind === 'none' ? [] : [[d.date.epochDay, d.kind] as const]))),
    ...overrides,
  };
}

/**
 * An ordinary day of `kcal`, `proteinG` and `fatG`, split over four meals of
 * foods eaten that day only (so no food stands out).
 */
export function plainDay(date: CalendarDate, kcal: number, proteinG: number, fatG: number): FoodEntry[] {
  const parts: readonly [Meal, number][] = [
    ['breakfast', 0.2],
    ['lunch', 0.3],
    ['dinner', 0.4],
    ['snack', 0.1],
  ];
  return parts.map(([meal, share]) => food(date, meal, `${meal} of ${date.toString()}`, kcal * share, proteinG * share, fatG * share));
}

/** The 14 days ending yesterday, oldest first. */
export const fortnight = Array.from({ length: 14 }, (_, i) => yesterday.addDays(i - 13));

/**
 * MM-606's first scenario, the owner's fat week: 14 whole days, fat at 1.4×
 * its 70 g target on 10 of them, protein under the 140 g minimum on 9, every
 * day within the calorie band; peanut butter at breakfast gives 35% of the
 * fat on 8 of the days. Oatmeal is the breakfast of the other days, and
 * crackers the snack of every day. Lunches and dinners differ every day.
 */
export function ownersFatWeek(): FixtureDay[] {
  // A: peanut butter, fat high, protein short. B: fat high, protein met. C: fat at target, protein short. D: both fine.
  const kinds = ['A', 'B', 'A', 'C', 'A', 'D', 'A', 'B', 'A', 'D', 'A', 'D', 'A', 'A'] as const;
  return fortnight.map((date, i) => {
    const kind = kinds[i] as (typeof kinds)[number];
    const lunch = (p: number) => food(date, 'lunch', `Lunch dish ${i}`, 750, p, 28);
    const dinner = (p: number, f: number) => food(date, 'dinner', `Dinner dish ${i}`, 900, p, f);
    const crackers = food(date, 'snack', 'Crackers', 330, 6, 10);
    const breakfast =
      kind === 'A'
        ? food(date, 'breakfast', 'Peanut butter', 400, 14, 34)
        : kind === 'B'
          ? food(date, 'breakfast', 'Eggs and bacon', 400, 24, 33)
          : food(date, 'breakfast', 'Oatmeal', 400, 14, 8);
    const rest =
      kind === 'A' || kind === 'C' ? [lunch(35), dinner(50, 26)] : kind === 'B' ? [lunch(60), dinner(60, 27)] : [lunch(60), dinner(66, 24)];
    return { date, entries: [breakfast, ...rest, crackers] };
  });
}
