import type { LoggedMeal } from '../food/meal/LoggedMeal';
import type { FoodEntry } from '../FoodEntry';

/**
 * Finds what the person has ever logged by its name (MM-596): the app's own
 * foods, grown by every food typed, estimated or analysed, so a food logged
 * once is found again however long ago it was.
 */
export interface LoggedFoodSearch {
  /**
   * Every food logged whose name holds `query`, ignoring case: distinct by
   * name, each as it was last logged, newest first, at most `limit` (25
   * unless given). The foods of meals are among them.
   */
  searchLoggedFoods(query: string, options?: { limit?: number }): Promise<FoodEntry[]>;

  /**
   * Every meal logged whose name holds `query`, ignoring case: distinct by
   * name, each as it was last logged, newest first, at most `limit` (10
   * unless given).
   */
  searchLoggedMeals(query: string, options?: { limit?: number }): Promise<LoggedMeal[]>;
}
