import type { DeletedImportsReader } from './DeletedImportsReader';
import type { WorkoutReader } from './WorkoutReader';
import type { WorkoutWriter } from './WorkoutWriter';

/**
 * Reads and writes workouts (MM-75). Deleting an imported workout keeps its
 * platform id among the deleted imports (MM-490).
 */
export interface WorkoutRepository extends WorkoutReader, WorkoutWriter, DeletedImportsReader {}
