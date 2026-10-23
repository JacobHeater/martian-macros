import type { CalendarDate } from '../../domain/CalendarDate';
import { entryOfMealItem } from '../../domain/food/meal/entryOfMealItem';
import type { MealDraft } from '../../domain/food/meal/MealDraft';
import type { Meal } from '../../domain/Meal';
import type { FoodEntryWriter } from '../../domain/repositories/FoodEntryWriter';
import { newMealKey } from './newMealKey';

/**
 * Logs every item of `draft` as one meal (MM-586, MM-587): ordinary food
 * entries on the same day, slot and time, sharing a new key and the meal's
 * name. Gives the key. All or nothing: when a food fails, those already
 * logged are removed and the failure is thrown on (MM-591).
 */
export async function logMeal(
  writer: FoodEntryWriter,
  draft: MealDraft,
  { date, meal, eatenAt }: { date: CalendarDate; meal: Meal; eatenAt: number | undefined },
): Promise<string> {
  const loggedMeal = { key: newMealKey(), name: draft.name.trim() };
  const added: number[] = [];
  try {
    for (const item of draft.items) added.push(await writer.addFood(entryOfMealItem(item, { date, meal, eatenAt, loggedMeal })));
  } catch (error) {
    for (const id of added) await writer.deleteFood(id).catch(() => undefined);
    throw error;
  }
  return loggedMeal.key;
}
