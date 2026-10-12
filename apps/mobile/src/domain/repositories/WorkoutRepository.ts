import type { WorkoutReader } from './WorkoutReader';
import type { WorkoutWriter } from './WorkoutWriter';

/** Reads and writes workouts (MM-75). */
export interface WorkoutRepository extends WorkoutReader, WorkoutWriter {}
