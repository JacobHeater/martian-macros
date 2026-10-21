import type { WorkoutSet } from '../domain/training/WorkoutSet';

/**
 * A set with both its times (MM-191): the only kind that can be written to
 * a health platform as a segment of its workout (MM-189).
 */
export interface TimedSet {
  readonly exerciseId: string;
  readonly set: WorkoutSet;
  readonly startedAt: Date;
  readonly endedAt: Date;
}
