import type { CalendarDate } from '../CalendarDate';
import type { FoodEntry } from '../FoodEntry';
import type { SavedMeal } from '../food/meal/SavedMeal';
import type { Watched } from '../../lang/Watched';

/** The meals the person saved to log again (MM-645). */
export interface SavedMealRepository {
  /** Every saved meal, newest first, each with its foods in the order saved. */
  watchSavedMeals(): Watched<SavedMeal[]>;

  /**
   * Saves `foods` as a meal called `name` on `on`, in one step, and gives
   * its id. Each food is kept as it is, apart from the meal it was one of:
   * a saved meal's foods are loose (the owner's D-2).
   */
  saveMeal(name: string, foods: readonly FoodEntry[], on: CalendarDate): Promise<number>;

  /** Removes the saved meal with `id`, and its foods. Does nothing if there is none. */
  deleteSavedMeal(id: number): Promise<void>;
}
