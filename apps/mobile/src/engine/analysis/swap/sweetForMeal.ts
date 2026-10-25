import type { FoodTag } from '../language/FoodTag';

/** What a meal food is never swapped for. */
const sweets: readonly FoodTag[] = ['dessert', 'candy', 'snackFood'];

/**
 * Whether a replacement would put a dessert, a candy or a snack food in a
 * meal food's place (MM-617): the food is none of those, and the
 * replacement is one. A snack may be swapped for another snack.
 */
export function sweetForMeal(food: ReadonlySet<FoodTag>, replacement: ReadonlySet<FoodTag>): boolean {
  const mealFood = !sweets.some((tag) => food.has(tag));
  return mealFood && sweets.some((tag) => replacement.has(tag));
}
