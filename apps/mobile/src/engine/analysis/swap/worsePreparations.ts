import type { FoodTag } from '../language/FoodTag';

/** Ways of making a food the coach would swap away from (MM-617): a replacement never adds one the food lacks. */
export const worsePreparations: readonly FoodTag[] = ['fried', 'breaded', 'sauced', 'creamy', 'sugaryDrink'];
