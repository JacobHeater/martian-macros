import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import type { Overlays } from '../ui/Overlays';
import { MealBreakdownSheet } from './MealBreakdownSheet';

/** Opens the on-demand coaching breakdown of `meal`'s entries on `day` (MM-666). */
export function showMealBreakdownSheet(
  overlays: Overlays,
  day: CalendarDate,
  meal: Meal,
  entries: readonly FoodEntry[],
): Promise<void> {
  return overlays
    .sheet<void>('Coach breakdown', () => <MealBreakdownSheet meal={meal} day={day} entries={entries} />)
    .then(() => undefined);
}
