import type { Meal } from '../../Meal';

/** What the day's running total reads of a food (MM-571): its calories, its meal, and when it was eaten, if known. */
export interface TimedFood {
  readonly kcal: number;
  readonly meal: Meal;
  /** Minutes after the day's midnight; undefined when the time was not recorded (MM-570). */
  readonly eatenAt: number | undefined;
}
