import type { FoodEntry } from '../../../domain/FoodEntry';
import type { Meal } from '../../../domain/Meal';

/**
 * The meal of a day that gave the most calories, taken apart (MM-617): its
 * foods ranked by the calories they gave against their protein, fat and
 * sodium, the worst one or two, and the one to keep.
 */
export interface MealBreakdown {
  /** The meal slot. */
  readonly meal: Meal;
  /** The subject's calories: the logged meal's, or the slot's. */
  readonly kcal: number;
  /** The meal logged as one (MM-587) that makes up most of the slot, by name; undefined when the slot is separate foods. */
  readonly name: string | undefined;
  /** That logged meal's key, the one its foods share; undefined when the slot is separate foods. */
  readonly key: string | undefined;
  /** The foods of the subject: the logged meal's, or the slot's. */
  readonly entries: readonly FoodEntry[];
  /** The worst food, and a second close behind it; empty when no food can be named. */
  readonly worst: readonly FoodEntry[];
  /** The food of a meal of several with the most protein for its calories, not among the worst. */
  readonly keep: FoodEntry | undefined;
}
