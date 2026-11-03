import type { CalendarDate } from '../../domain/CalendarDate';
import { entryOfMealItem } from '../../domain/food/meal/entryOfMealItem';
import type { MealDraft } from '../../domain/food/meal/MealDraft';
import type { Meal } from '../../domain/Meal';
import type { FoodEntryBatchWriter } from '../../domain/repositories/FoodEntryBatchWriter';
import { newMealKey } from './newMealKey';

/**
 * Logs every item of `draft` as one meal (MM-586, MM-587): ordinary food
 * entries on the same day, slot and time, sharing a new key and the meal's
 * name. Gives the key. One write, all or nothing (MM-591, MM-625, MM-722):
 * the log is never written food by food, nothing waits on the health
 * platform between foods, and a failure logs nothing and is thrown on.
 */
export async function logMeal(
  writer: FoodEntryBatchWriter,
  draft: MealDraft,
  { date, meal, eatenAt }: { date: CalendarDate; meal: Meal; eatenAt: number | undefined },
): Promise<string> {
  const loggedMeal = { key: newMealKey(), name: draft.name.trim() };
  await writer.applyFoodChanges({ add: draft.items.map((item) => entryOfMealItem(item, { date, meal, eatenAt, loggedMeal })) });
  return loggedMeal.key;
}
