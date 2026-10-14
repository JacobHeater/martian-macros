import type { Meal } from '../domain/Meal';
import type { MmIconName } from '../ui/MmIconName';

const icons: Readonly<Record<Meal, MmIconName>> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snack: 'snack',
};

/** The icon of a meal's section header (MM-255). */
export const mealIcon = (meal: Meal): MmIconName => icons[meal];
