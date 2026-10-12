import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';
import type { FoodEntry } from '../FoodEntry';

/** Reads the food logged on one day. */
export interface FoodDayReader {
  /**
   * The entries for `date` in the order they were added, then the full
   * list after each change.
   */
  watchFood(date: CalendarDate): Watched<FoodEntry[]>;
}
