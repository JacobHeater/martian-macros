import type { Workout } from '../domain/training/Workout';
import type { TimedSet } from './TimedSet';

/**
 * The sets of `workout` that can be written to a platform as segments
 * (MM-191), in the order they began. A set missing either time is left
 * out, and no time is invented for it; the workout itself is still
 * written as a session (MM-189's fallback).
 */
export function timedSetsOf(workout: Workout): readonly TimedSet[] {
  const timed: TimedSet[] = [];
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      const { startedAt, endedAt } = set;
      if (startedAt === undefined || endedAt === undefined) continue;
      timed.push({ exerciseId: exercise.exerciseId, set, startedAt, endedAt });
    }
  }
  return timed.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
}
