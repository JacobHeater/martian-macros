import type { CalendarDate } from '../../CalendarDate';
import type { MealItemDraft } from './MealItemDraft';

/** An analysed meal before it is logged (MM-586): its name, its foods, and when it was eaten. */
export interface MealDraft {
  readonly name: string;
  readonly items: readonly MealItemDraft[];
  /** The day it was eaten, as the person told the assistant (MM-594); undefined when not said. */
  readonly eatenOn?: CalendarDate | undefined;
  /**
   * The minute of its day it was eaten, 0 to 1439, as the person told the
   * assistant (MM-594); undefined when not said, or not a time.
   */
  readonly eatenAt?: number | undefined;
}
