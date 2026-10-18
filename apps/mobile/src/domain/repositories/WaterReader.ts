import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';
import type { WaterEntry } from '../water/WaterEntry';

/** Reads the water log (MM-313). */
export interface WaterReader {
  /** The water logged on `date`, earliest first, then the list after each change. */
  watchWater(date: CalendarDate): Watched<WaterEntry[]>;

  /** The water logged on `since` or later, earliest first, then the list after each change. */
  watchWaterSince(since: CalendarDate): Watched<WaterEntry[]>;
}
