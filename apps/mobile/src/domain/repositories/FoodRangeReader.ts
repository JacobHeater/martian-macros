import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';
import type { FoodEntry } from '../FoodEntry';

/** Reads the food logged over a run of days (MM-570). */
export interface FoodRangeReader {
  /**
   * Every entry dated `first` to `last`, both included, by day and then in
   * the order added; then the full list after each change. Empty when
   * `last` is before `first`.
   */
  watchFoodBetween(first: CalendarDate, last: CalendarDate): Watched<FoodEntry[]>;
}
