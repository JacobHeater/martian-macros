import type { Watched } from '../../lang/Watched';
import type { Exercise } from '../training/Exercise';

/** Reads the exercises the user added (MM-76). */
export interface CustomExerciseReader {
  /**
   * Every exercise the user added, by name, then the full list after each
   * change.
   */
  watchCustomExercises(): Watched<Exercise[]>;
}
