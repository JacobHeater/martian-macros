import type { CalendarDate } from '../../domain/CalendarDate';
import type { LoggedMeal } from '../../domain/food/meal/LoggedMeal';
import type { Meal } from '../../domain/Meal';
import type { FoodEntryBatchWriter } from '../../domain/repositories/FoodEntryBatchWriter';
import { entriesCopiedTo } from '../entriesCopiedTo';

/**
 * Logs `loggedMeal` again (MM-587): the same foods on `date` in `meal`, at
 * `eatenAt`, as a new meal under the same name. Gives the new entries' ids.
 * All or nothing, in one step (MM-625).
 */
export async function relogMeal(
  writer: FoodEntryBatchWriter,
  loggedMeal: LoggedMeal,
  { date, meal, eatenAt }: { date: CalendarDate; meal: Meal; eatenAt: number | undefined },
): Promise<number[]> {
  return writer.applyFoodChanges({ add: entriesCopiedTo(date, loggedMeal.items, { meal }).map((copy) => copy.copyWith({ eatenAt })) });
}
