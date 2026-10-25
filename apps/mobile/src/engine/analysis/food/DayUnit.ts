import type { FoodEntry } from '../../../domain/FoodEntry';
import type { Meal } from '../../../domain/Meal';
import type { CoachAdviceFood } from '../CoachAdviceFood';

/**
 * One thing eaten on a day, as the coach's orders name it (MM-617): a meal
 * logged as one (MM-587), under its name, or a food on its own. The meal the
 * breakdown takes apart is its foods instead, each with `mealName`.
 */
export interface DayUnit {
  readonly food: CoachAdviceFood;
  readonly carbsG: number;
  readonly meal: Meal;
  /** The meal logged as one that this food is one of, when the breakdown took that meal apart. */
  readonly mealName: string | undefined;
  readonly entries: readonly FoodEntry[];
}
