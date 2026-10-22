import type { CalendarDate } from '../domain/CalendarDate';
import type { WorkoutSet } from '../domain/training/WorkoutSet';

/** One finished session's best qualifying estimate and its smoothed value. */
export interface StrengthPoint {
  readonly workoutId: number;
  readonly date: CalendarDate;
  readonly estimateKg: number;
  readonly trendKg: number;
  /**
   * The set that gave `estimateKg` (MM-118): for a bodyweight exercise with the
   * weight hidden it is said in place of the estimate, which carries the body weight.
   */
  readonly bestSet?: WorkoutSet | undefined;
}
