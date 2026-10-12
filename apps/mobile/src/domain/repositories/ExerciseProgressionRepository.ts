import type { ExerciseProgressionReader } from './ExerciseProgressionReader';
import type { ExerciseProgressionWriter } from './ExerciseProgressionWriter';

/** Reads and writes the rep ranges and load steps the user set (MM-79). */
export interface ExerciseProgressionRepository extends ExerciseProgressionReader, ExerciseProgressionWriter {}
