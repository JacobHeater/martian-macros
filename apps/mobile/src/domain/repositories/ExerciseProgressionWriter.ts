import type { ExerciseProgression } from '../training/ExerciseProgression';

/** Saves and clears the rep ranges and load steps the user set (MM-79). */
export interface ExerciseProgressionWriter {
  /** Sets it for its exercise, replacing any there. */
  saveExerciseProgression(progression: ExerciseProgression): Promise<void>;

  /**
   * Goes back to the defaults for `exerciseId`. Does nothing if none is
   * set.
   */
  clearExerciseProgression(exerciseId: string): Promise<void>;
}
