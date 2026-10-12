import type { Meal } from '../domain';

const labels: Readonly<Record<Meal, string>> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

export const mealLabel = (meal: Meal): string => labels[meal];
