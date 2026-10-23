import type { Meal } from '../../Meal';

/** One rise of the day's running total (MM-571): when, by how much, to what, and whether its time is a guess. */
export interface IntakeStep {
  /** Minutes after midnight. */
  readonly minute: number;
  /** What this step adds. */
  readonly added: number;
  /** The day's total once it is in. */
  readonly total: number;
  readonly meal: Meal;
  /** No food in it has a recorded time, so it stands at its meal's usual time (`mealUsualMinute`, MM-571). */
  readonly approximate: boolean;
}
