import type { Exercise } from '../training/Exercise';

/** Saves and deletes the exercises the user added (MM-76). */
export interface CustomExerciseWriter {
  /**
   * Saves `exercise`: a new one when its id is empty, otherwise a
   * replacement of the one with that id. Returns its id, which starts with
   * `Exercise.customIdPrefix`. Sets already logged against it are not
   * touched.
   */
  saveCustomExercise(exercise: Exercise): Promise<string>;

  /**
   * Removes the exercise with `id`. Does nothing if there is none. Sets
   * logged against it keep its id.
   */
  deleteCustomExercise(id: string): Promise<void>;
}
