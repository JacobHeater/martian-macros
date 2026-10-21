import type { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import type { NutritionRecord } from '../healthIngest/NutritionRecord';
import { foodRecordId } from './foodRecordId';

/**
 * When each meal is written on its day, as hours and minutes (MM-70). The
 * app keeps a food's day and meal, not the minute it was logged, so a meal
 * is written at the same time whenever it is written again, and an edit
 * replaces it rather than moving it.
 */
const mealTime: Record<Meal, readonly [hour: number, minute: number]> = {
  breakfast: [8, 0],
  lunch: [12, 30],
  snack: [15, 30],
  dinner: [18, 30],
};

/** How long each written meal lasts on the platform, which wants a span. */
const mealMs = 30 * 60 * 1000;

/**
 * What the health platform is told about a logged food (MM-70): energy and
 * the three macros, and fiber, sugars, saturated fat and sodium when the
 * entry states them, never zero for what it does not. Its id is the app's
 * own, so a change replaces it and a removal finds it.
 */
export function nutritionRecordOf(entry: FoodEntry, id: number): NutritionRecord {
  const [hour, minute] = mealTime[entry.meal];
  const start = new Date(entry.date.year, entry.date.month - 1, entry.date.day, hour, minute);
  return {
    id: foodRecordId(id),
    start,
    end: new Date(start.getTime() + mealMs),
    kcal: entry.kcal,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
    name: entry.name,
    meal: entry.meal,
    fiberG: entry.fiberG,
    sugarsG: entry.micros.of('sugars'),
    saturatedFatG: entry.micros.of('saturatedFat'),
    sodiumMg: entry.sodiumMg,
  };
}
