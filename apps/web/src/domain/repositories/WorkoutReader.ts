import type { Watched } from '../../lang/Watched';
import type { Workout } from '../training/Workout';

/** Reads logged workouts (MM-75). */
export interface WorkoutReader {
  /**
   * Every workout, most recently started first, then the full list after
   * each change.
   */
  watchWorkouts(): Watched<Workout[]>;
}
