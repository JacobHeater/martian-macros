import type { CalendarDate } from '../domain/CalendarDate';
import type { MealSize } from '../domain/food/estimate/MealSize';
import type { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import type { Navigator } from '../app/Navigator';
import { LibraryScreen } from '../library/LibraryScreen';
import type { Overlays } from '../ui/Overlays';
import { showAddFoodSheet } from './showAddFoodSheet';

/**
 * Opens the add-food sheet from a screen under the navigator (MM-707): a
 * sheet stands above every screen and cannot open one itself, so when its
 * Saved step asks for the Library the sheet closes and the Library is
 * pushed over the screen that opened it.
 */
export async function addFoodFrom(
  from: { overlays: Overlays; navigator: Navigator },
  day: CalendarDate,
  options: { meal?: Meal; entry?: FoodEntry; initialQuery?: string; estimateSize?: MealSize } = {},
): Promise<void> {
  const asked = await showAddFoodSheet(from.overlays, day, options);
  if (asked === 'manage') void from.navigator.push(() => <LibraryScreen />);
}
