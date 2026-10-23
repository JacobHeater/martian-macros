import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import type { Overlays } from '../ui/Overlays';
import { MealSplitSheet } from './MealSplitSheet';

/** Opens the macro split of `meal`'s entries on `day` (MM-597). */
export function showMealSplitSheet(overlays: Overlays, day: CalendarDate, meal: Meal, entries: readonly FoodEntry[]): Promise<void> {
  return overlays.sheet<void>('Macro split', () => <MealSplitSheet meal={meal} day={day} entries={entries} />).then(() => undefined);
}
