import type { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { Meal } from '../../src/domain/Meal';

/** One weighed food on `date`, not yet saved. */
export function foodOn(
  date: CalendarDate,
  {
    name = 'Dinner',
    meal = 'dinner',
    kcal = 2100,
    proteinG = 150,
    carbsG = 200,
    fatG = 70,
  }: { name?: string; meal?: Meal; kcal?: number; proteinG?: number; carbsG?: number; fatG?: number } = {},
): FoodEntry {
  return new FoodEntry({ id: 0, date, meal, name, kcal, proteinG, carbsG, fatG, source: 'weighed' });
}
