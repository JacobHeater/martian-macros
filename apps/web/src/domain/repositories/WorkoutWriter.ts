import type { Workout } from '../training/Workout';

/** Saves and deletes workouts (MM-75). */
export interface WorkoutWriter {
  /**
   * Saves `workout` with its exercises and sets: a new one when its id is 0,
   * otherwise a replacement of the one with that id. Returns its id.
   */
  saveWorkout(workout: Workout): Promise<number>;

  /**
   * Removes the workout with `id` and its sets. Does nothing if there is
   * none.
   */
  deleteWorkout(id: number): Promise<void>;
}
