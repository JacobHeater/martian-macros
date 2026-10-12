import type { Watched } from '../../lang/Watched';
import type { ExerciseProgression } from '../training/ExerciseProgression';

/** Reads the rep ranges and load steps the user set (MM-79). */
export interface ExerciseProgressionReader {
  /** Every one set, by exercise id, then the full list after each change. */
  watchExerciseProgressions(): Watched<ExerciseProgression[]>;
}
