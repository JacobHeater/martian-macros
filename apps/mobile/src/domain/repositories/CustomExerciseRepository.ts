import type { CustomExerciseReader } from './CustomExerciseReader';
import type { CustomExerciseWriter } from './CustomExerciseWriter';

/** Reads and writes the user's own exercises (MM-76). */
export interface CustomExerciseRepository extends CustomExerciseReader, CustomExerciseWriter {}
