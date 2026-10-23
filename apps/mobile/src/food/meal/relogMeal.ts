import type { CalendarDate } from '../../domain/CalendarDate';
import type { LoggedMeal } from '../../domain/food/meal/LoggedMeal';
import type { Meal } from '../../domain/Meal';
import type { FoodEntryWriter } from '../../domain/repositories/FoodEntryWriter';
import { entriesCopiedTo } from '../entriesCopiedTo';

/**
 * Logs `loggedMeal` again (MM-587): the same foods on `date` in `meal`, at
 * `eatenAt`, as a new meal under the same name. Gives the new entries' ids.
 */
export async function relogMeal(
  writer: FoodEntryWriter,
  loggedMeal: LoggedMeal,
  { date, meal, eatenAt }: { date: CalendarDate; meal: Meal; eatenAt: number | undefined },
): Promise<number[]> {
  const ids: number[] = [];
  for (const copy of entriesCopiedTo(date, loggedMeal.items, { meal })) ids.push(await writer.addFood(copy.copyWith({ eatenAt })));
  return ids;
}
