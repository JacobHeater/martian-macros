import type { Meal } from '../../../domain/Meal';

/** The slot after `meal` today (MM-684): breakfast to lunch, lunch to dinner, dinner to a snack; after a snack, none. */
export function nextMealSlot(meal: Meal): Meal | undefined {
  switch (meal) {
    case 'breakfast':
      return 'lunch';
    case 'lunch':
      return 'dinner';
    case 'dinner':
      return 'snack';
    case 'snack':
      return undefined;
  }
}
