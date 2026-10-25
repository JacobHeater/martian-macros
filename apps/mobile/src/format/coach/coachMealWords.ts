import type { Meal } from '../../domain/Meal';

const words: Readonly<Record<Meal, string>> = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'your snack' };

/** A meal in the coach's sentences (MM-617): "breakfast", "lunch", "dinner", "your snack". */
export function coachMealWords(meal: Meal): string {
  return words[meal];
}
