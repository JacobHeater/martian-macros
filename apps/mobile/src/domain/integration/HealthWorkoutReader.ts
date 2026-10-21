import type { PlatformWorkout } from '../training/PlatformWorkout';

/**
 * Reads workouts from a phone's health platform with what is inside them
 * (MM-189). Permission to read workouts is the health source's (MM-67).
 */
export interface HealthWorkoutReader {
  /**
   * The workouts that start from `from` up to, not including, `to`, oldest
   * first, each with its segments. Empty when reading workouts is not
   * permitted.
   */
  readWorkouts(range: { from: Date; to: Date }): Promise<PlatformWorkout[]>;
}
