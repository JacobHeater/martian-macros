import type { CalendarDate } from '../../domain/CalendarDate';
import type { Overlays } from '../../ui/Overlays';
import { ViewMealSheet } from './ViewMealSheet';

/** Opens View meal for the meal with `key` logged on `day` (MM-587). */
export function showViewMealSheet(overlays: Overlays, day: CalendarDate, key: string): Promise<void> {
  return overlays
    .sheet<void>('View meal', (close) => <ViewMealSheet day={day} mealKey={key} onDone={() => close()} />, { size: 'tall' })
    .then(() => undefined);
}
