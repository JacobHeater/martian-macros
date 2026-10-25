import type { FoodEntry } from '../../../src/domain/FoodEntry';
import type { FoodAnalysisInput } from '../../../src/engine/analysis/food/FoodAnalysisInput';
import type { InsightSafeguards } from '../../../src/engine/InsightSafeguards';
import { food, inputOf, safeguards, targets, today } from './foodAnalysis';

/**
 * The owner's buffet day, 2026-10-24 (MM-617's first scenario), at 7:40 pm
 * with no dinner logged:
 *
 * - **Breakfast:** "Sausage egg and cheese biscuit with extra eggs", a meal
 *   logged as one of 5 foods: 691 kcal, P31 C39 F45, sodium 1,600 mg.
 * - **Lunch:** "Diet Pepsi Cola 12 Fluid Ounce Aluminum Can (Pepsi)", 36 fl
 *   oz, 0 kcal; and "Chinese buffet", a meal logged as one of 13 foods:
 *   2,368 kcal, P123 C222 F103, sodium 5,138 mg, General Tso's chicken
 *   among them at 744 kcal, P32 C66 F33, sodium 1,800 mg.
 * - **Snack:** "COOKIE BUTTER, CRUNCHY (LOTUS)", 170 kcal, P1 C18 F11.
 *
 * The day: 3,229 kcal (1,054 over), protein 155 g, fat 159 g, sodium 6,923
 * mg (3.8× the limit), fiber 14 g. Targets: 2,175 kcal on fat loss,
 * protein 187 g with a 149 g minimum, fat 60 g, sodium limit 1,800 mg;
 * fiber's guide is 30 g (14 g per 1,000 kcal).
 */
export const buffetDayMinute = 19 * 60 + 40;

const breakfastMeal = { key: 'breakfast-biscuit', name: 'Sausage egg and cheese biscuit with extra eggs' };
const buffetMeal = { key: 'lunch-buffet', name: 'Chinese buffet' };

/** The day's foods: name, kcal, protein, carbohydrate, fat, sodium, fiber. */
type Row = readonly [name: string, kcal: number, proteinG: number, carbsG: number, fatG: number, sodiumMg: number, fiberG: number];

const breakfast: readonly Row[] = [
  ['Buttermilk biscuit', 260, 3, 35, 12, 650, 1],
  ['Pork sausage patty', 170, 7, 1, 15, 420, 0],
  ['Eggs', 140, 12, 1, 10, 140, 0],
  ['Extra egg', 70, 6, 0.5, 5, 70, 0],
  ['American cheese', 51, 3, 1.5, 3, 320, 0],
];

const buffet: readonly Row[] = [
  ["General Tso's chicken", 744, 32, 66, 33, 1800, 0.5],
  ['Fried rice', 274, 6, 36, 11, 600, 1],
  ['Lo mein', 230, 8, 27, 10, 550, 1],
  ['Egg rolls', 220, 6, 22, 12, 450, 0],
  ['Crab rangoon', 180, 5, 14, 12.2, 300, 0],
  ['Steamed broccoli', 50, 4, 8, 0.5, 30, 4],
  ['Steamed chicken with vegetables', 180, 29, 4, 6, 350, 2],
  ['Hot and sour soup', 90, 4, 10, 3.5, 600, 0],
  ['Beef with broccoli', 200, 16, 10, 10, 220, 2],
  ['Peel-and-eat shrimp', 60, 9, 1, 2, 80, 0],
  ['Egg drop soup', 70, 3, 8, 2.5, 140, 0],
  ['Fortune cookie', 30, 0.4, 7, 0.2, 18, 0],
  ['Orange slices', 40, 0.6, 9, 0.1, 0, 2],
];

/** The owner's buffet day's entries. */
export function buffetDayEntries(): FoodEntry[] {
  const of = (meal: 'breakfast' | 'lunch', tag: { key: string; name: string }) =>
    ([name, kcal, proteinG, carbsG, fatG, sodiumMg, fiberG]: Row) =>
      food(today, meal, name, kcal, proteinG, fatG, { carbsG, sodiumMg, fiberG, loggedMeal: tag });
  return [
    ...breakfast.map(of('breakfast', breakfastMeal)),
    food(today, 'lunch', 'Diet Pepsi Cola 12 Fluid Ounce Aluminum Can (Pepsi)', 0, 0, 0, { carbsG: 0, sodiumMg: 105, fiberG: 0, grams: 1065 }),
    ...buffet.map(of('lunch', buffetMeal)),
    food(today, 'snack', 'COOKIE BUTTER, CRUNCHY (LOTUS)', 170, 1, 11, { carbsG: 18, sodiumMg: 80, fiberG: 0.5 }),
  ];
}

/** The analysis's input for the owner's buffet day, with every safeguard allowing unless overridden. */
export function buffetDayInput(overrides: Partial<InsightSafeguards> = {}): FoodAnalysisInput {
  return inputOf([{ date: today, entries: buffetDayEntries() }], {
    history: [targets(today.addDays(-200), { kcal: 2175, proteinG: 187, proteinMinimumG: 149, fatG: 60, carbsG: 222, mode: 'fatLoss' })],
    safeguards: safeguards(overrides),
    sodium: { limitMg: 1800, since: today.addDays(-100) },
    fiber: { sex: 'male', checkIns: [] },
  });
}
