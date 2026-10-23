import type { CalendarDate } from '../../src/domain/CalendarDate';
import type { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
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
    sodiumMg,
    micros,
    eatenAt,
  }: {
    name?: string;
    meal?: Meal;
    kcal?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    sodiumMg?: number;
    micros?: Micronutrients;
    /** Minutes after midnight of `date` it was eaten at (MM-570); none by default. */
    eatenAt?: number;
  } = {},
): FoodEntry {
  return new FoodEntry({ id: 0, date, meal, name, kcal, proteinG, carbsG, fatG, source: 'weighed', sodiumMg, micros, eatenAt });
}
