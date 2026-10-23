import type { CalendarDate } from '../domain/CalendarDate';
import type { MealSize } from '../domain/food/estimate/MealSize';
import type { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import type { Overlays } from '../ui/Overlays';
import { AddFoodSheet } from './AddFoodSheet';

/**
 * Opens the add-food sheet for `day`, optionally preselecting a meal, or
 * editing `entry`. It is tall, so it keeps its height as results come and
 * go under the search (MM-566).
 */
export function showAddFoodSheet(
  overlays: Overlays,
  day: CalendarDate,
  options: { meal?: Meal; entry?: FoodEntry; initialQuery?: string; estimateSize?: MealSize } = {},
): Promise<void> {
  const editing = options.entry !== undefined;
  return overlays
    .sheet<void>(
      editing ? 'Edit food' : 'Add food',
      (close) => <AddFoodSheet day={day} {...options} onDone={() => close()} />,
      { size: 'tall' },
    )
    .then(() => undefined);
}
