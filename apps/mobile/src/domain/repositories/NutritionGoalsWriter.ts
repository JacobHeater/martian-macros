import type { CalendarDate } from '../CalendarDate';

/** Writes the sodium limit and the water goal (MM-311, MM-313). */
export interface NutritionGoalsWriter {
  /** Sets the daily sodium limit in milligrams on `on`, or switches it off with undefined. */
  saveSodiumLimit(mg: number | undefined, on: CalendarDate): Promise<void>;

  /**
   * Sets the daily water goal to the person's own amount in millilitres, or,
   * with undefined, back to the one suggested for them (MM-358). Either way
   * the goal is on.
   */
  saveWaterGoal(ml: number | undefined): Promise<void>;

  /** Switches the water goal off, or on again (MM-358). */
  saveWaterGoalOff(off: boolean): Promise<void>;
}
