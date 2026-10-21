import type { WorkoutForPlatform } from '../training/WorkoutForPlatform';

/**
 * Writes the app's workouts to a phone's health platform (MM-189). Writing
 * is a permission of its own, apart from reading, and off until the user
 * grants it; refusing it changes nothing in the app.
 */
export interface HealthWorkoutWriter {
  /**
   * Whether the platform can name exercises inside a workout: Health
   * Connect can, HealthKit cannot (MM-188). Where it cannot, a workout is
   * written as a session only.
   */
  readonly namesExercises: boolean;

  /** Whether the user has let the app write workouts. */
  writePermitted(): Promise<boolean>;

  /** Asks the user. Returns whether writing is permitted afterwards. */
  requestWritePermission(): Promise<boolean>;

  /**
   * Writes `workout`, replacing what was written before with the same
   * `clientId`. False, and nothing written, when writing is not permitted
   * or the platform would not take it.
   */
  writeWorkout(workout: WorkoutForPlatform): Promise<boolean>;

  /**
   * Removes the workout written under `clientId` (MM-515), and nothing
   * another app wrote. False, and nothing removed, when writing is not
   * permitted or the platform would not remove it.
   */
  removeWorkout(clientId: string): Promise<boolean>;
}
