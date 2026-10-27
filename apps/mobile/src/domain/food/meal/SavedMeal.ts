import type { FoodEntry } from '../../FoodEntry';

/**
 * A meal kept to log again in one press (MM-645): its name and its foods,
 * each as it was logged, with every number, its amount and where it came
 * from. Logged again, they are loose foods at the meal and time chosen then
 * (the owner's D-2); the day and time they were saved from mean nothing.
 */
export interface SavedMeal {
  readonly id: number;
  readonly name: string;
  readonly foods: readonly FoodEntry[];
}
