import type { Watched } from '../../lang/Watched';
import type { LoggedMeal } from '../food/meal/LoggedMeal';
import type { FoodEntry } from '../FoodEntry';

/** Reads recently logged foods and meals, for one-tap re-logging. */
export interface RecentFoodReader {
  /**
   * The most recently logged distinct foods (by name, ignoring case),
   * newest first, at most `limit` (20 unless given). The foods of a meal
   * are not among them: the meal is (MM-587).
   */
  watchRecentFoods(options?: { limit?: number }): Watched<FoodEntry[]>;

  /**
   * The most recently logged distinct meals (by name, ignoring case), each
   * as it was last logged, newest first, at most `limit` (5 unless given)
   * (MM-587).
   */
  watchRecentMeals(options?: { limit?: number }): Watched<LoggedMeal[]>;
}
