import type { CalendarDate } from '../domain/CalendarDate';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import type { FoodEntry } from '../domain/FoodEntry';

/**
 * Some foods copied to another phone (MM-715): the day they are for, the entries as they are to be logged there
 * (fresh copies, id 0, no time eaten), and the Library foods they were logged from on the sending phone (origin
 * pack `custom`, MM-167), with the ids they had there, so the receiving phone can link the entries to its own.
 */
export interface FoodCopy {
  readonly day: CalendarDate;
  readonly entries: readonly FoodEntry[];
  readonly foods: readonly CustomFood[];
}
