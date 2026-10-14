import type { Workout } from '../domain/training/Workout';

/** Finished workouts under one heading of the Train list (MM-258). */
export interface WorkoutGroup {
  readonly title: string;
  readonly workouts: readonly Workout[];
}
