import type { MealPortionEaten } from '../domain/food/meal/MealPortionEaten';

const labels: Readonly<Record<MealPortionEaten, string>> = {
  all: 'All of it',
  most: 'Most',
  half: 'About half',
  little: 'A little',
};

/** What a chip says for how much was eaten (MM-599). */
export const mealPortionEatenLabel = (eaten: MealPortionEaten): string => labels[eaten];
