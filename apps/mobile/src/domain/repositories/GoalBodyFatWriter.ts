import type { GoalBodyFat } from '../GoalBodyFat';

/** Writes the goal body fat the user set (MM-36). Checking it against the floors is the engine's. */
export interface GoalBodyFatWriter {
  /** Sets the goal, replacing any earlier one. */
  saveGoalBodyFat(goal: GoalBodyFat): Promise<void>;

  /** Removes the goal; the plan goes back to its default line. */
  clearGoalBodyFat(): Promise<void>;
}
