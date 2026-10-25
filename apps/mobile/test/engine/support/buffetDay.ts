import type { FoodEntry } from '../../../src/domain/FoodEntry';
import type { FoodAnalysisInput } from '../../../src/engine/analysis/food/FoodAnalysisInput';
import type { InsightSafeguards } from '../../../src/engine/InsightSafeguards';
import { buffetDayFoods } from '../../../src/gallery/screens/buffetDayFoods';
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
 * The foods are the Coach tab's story's too (`buffetDayFoods`). The day: 3,229 kcal (1,054 over), protein 155 g, fat 159 g, sodium 6,923
 * mg (3.8× the limit), fiber 14 g. Targets: 2,175 kcal on fat loss,
 * protein 187 g with a 149 g minimum, fat 60 g, sodium limit 1,800 mg;
 * fiber's guide is 30 g (14 g per 1,000 kcal).
 */
export const buffetDayMinute = 19 * 60 + 40;

const { breakfastMeal, buffetMeal, breakfast, buffet, drink, drinkGrams, snack } = buffetDayFoods;

/** The day's foods: name, kcal, protein, carbohydrate, fat, sodium, fiber. */
type Row = readonly [name: string, kcal: number, proteinG: number, carbsG: number, fatG: number, sodiumMg: number, fiberG: number];

/** The owner's buffet day's entries. */
export function buffetDayEntries(): FoodEntry[] {
  const of = (meal: 'breakfast' | 'lunch', tag: { readonly key: string; readonly name: string }) =>
    ([name, kcal, proteinG, carbsG, fatG, sodiumMg, fiberG]: Row) =>
      food(today, meal, name, kcal, proteinG, fatG, { carbsG, sodiumMg, fiberG, loggedMeal: tag });
  return [
    ...breakfast.map(of('breakfast', breakfastMeal)),
    food(today, 'lunch', drink[0], drink[1], drink[2], drink[4], { carbsG: drink[3], sodiumMg: drink[5], fiberG: drink[6], grams: drinkGrams }),
    ...buffet.map(of('lunch', buffetMeal)),
    food(today, 'snack', snack[0], snack[1], snack[2], snack[4], { carbsG: snack[3], sodiumMg: snack[5], fiberG: snack[6] }),
  ];
}

/** The analysis's input for the owner's buffet day, with every safeguard allowing unless overridden. */
export function buffetDayInput(overrides: Partial<InsightSafeguards> = {}): FoodAnalysisInput {
  return inputOf([{ date: today, entries: buffetDayEntries() }], {
    history: [targets(today.addDays(-200), { ...buffetDayFoods.targets, mode: 'fatLoss' })],
    safeguards: safeguards(overrides),
    sodium: { limitMg: buffetDayFoods.sodiumLimitMg, since: today.addDays(-100) },
    fiber: { sex: 'male', checkIns: [] },
  });
}
