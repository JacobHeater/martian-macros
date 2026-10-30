import type { CalendarDate } from '../domain/CalendarDate';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import type { FoodEntry } from '../domain/FoodEntry';
import type { WaterEntry } from '../domain/water/WaterEntry';

/**
 * Some foods or water copied to another phone (MM-715, MM-718): the day they are for, the food entries as they are
 * to be logged there (fresh copies, id 0, each with its time eaten, MM-717), the drinks of water with when each was
 * had, and the Library foods the entries were logged from on the sending phone (origin pack `custom`, MM-167),
 * with the ids they had there, so the receiving phone can link the entries to its own. At least one entry or
 * drink.
 */
export interface FoodCopy {
  readonly day: CalendarDate;
  readonly entries: readonly FoodEntry[];
  readonly water: readonly WaterEntry[];
  readonly foods: readonly CustomFood[];
}
