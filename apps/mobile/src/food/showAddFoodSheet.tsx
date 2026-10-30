import type { CalendarDate } from '../domain/CalendarDate';
import type { MealSize } from '../domain/food/estimate/MealSize';
import type { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import type { Overlays } from '../ui/Overlays';
import { AddFoodSheet } from './AddFoodSheet';

/**
 * Opens the add-food sheet for `day`, optionally preselecting a meal, or
 * editing `entry`. It is tall, so it keeps its height as results come and
 * go under the search (MM-566). Resolves once it is closed: with `manage`
 * when its Saved step asked for the Library (MM-707), which the screen that
 * opened the sheet then pushes (`addFoodFrom`), since a sheet stands above
 * every screen and can open none itself.
 */
export function showAddFoodSheet(
  overlays: Overlays,
  day: CalendarDate,
  options: { meal?: Meal; entry?: FoodEntry; initialQuery?: string; estimateSize?: MealSize } = {},
): Promise<'manage' | undefined> {
  const editing = options.entry !== undefined;
  // Foods in the meal's list are not left behind without asking (MM-631).
  const mayLeave: { current: (() => Promise<boolean>) | undefined } = { current: undefined };
  return overlays.sheet<'manage'>(
    editing ? 'Edit food' : 'Add food',
    (close) => <AddFoodSheet day={day} {...options} mayLeave={mayLeave} onDone={() => close()} onManage={() => close('manage')} />,
    { size: 'tall', mayLeave },
  );
}
