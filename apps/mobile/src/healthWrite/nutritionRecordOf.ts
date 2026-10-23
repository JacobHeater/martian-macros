import type { FoodEntry } from '../domain/FoodEntry';
import { mealUsualMinute } from '../domain/mealUsualMinute';
import type { NutritionRecord } from '../healthIngest/NutritionRecord';
import { foodRecordId } from './foodRecordId';

/** How long each written meal lasts on the platform, which wants a span. */
const mealMs = 30 * 60 * 1000;

/**
 * What the health platform is told about a logged food (MM-70): energy and
 * the three macros, and fiber, sugars, saturated fat and sodium when the
 * entry states them, never zero for what it does not. Its id is the app's
 * own, so a change replaces it and a removal finds it.
 */
export function nutritionRecordOf(entry: FoodEntry, id: number, namespace: string): NutritionRecord {
  // At the time it was eaten when that is known (MM-570), otherwise at its meal's usual time (MM-70). The time is the
  // entry's own, so a food is written at the same time whenever it is written again, and an edit replaces it.
  const minute = entry.eatenAt ?? mealUsualMinute(entry.meal);
  const start = new Date(entry.date.year, entry.date.month - 1, entry.date.day, Math.trunc(minute / 60), minute % 60);
  return {
    id: foodRecordId(namespace, id),
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
