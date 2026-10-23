import type { Meal } from './Meal';

/**
 * When each meal is usually eaten, in minutes after midnight (MM-70,
 * MM-570): where a food with no time eaten is placed on its day, and where
 * the time eaten is first offered for it.
 */
const usual: Record<Meal, number> = {
  breakfast: 8 * 60,
  lunch: 12 * 60 + 30,
  snack: 15 * 60 + 30,
  dinner: 18 * 60 + 30,
};

/** The minute of the day `meal` is usually eaten at. */
export function mealUsualMinute(meal: Meal): number {
  return usual[meal];
}
