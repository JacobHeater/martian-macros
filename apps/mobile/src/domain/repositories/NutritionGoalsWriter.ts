import type { CalendarDate } from '../CalendarDate';

/** Writes the sodium limit and the water goal (MM-311, MM-313). */
export interface NutritionGoalsWriter {
  /** Sets the daily sodium limit in milligrams on `on`, or switches it off with undefined. */
  saveSodiumLimit(mg: number | undefined, on: CalendarDate): Promise<void>;

  /** Sets the daily water goal in millilitres, or switches it off with undefined. */
  saveWaterGoal(ml: number | undefined): Promise<void>;
}
