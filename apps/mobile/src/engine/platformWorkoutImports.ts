import type { Exercise } from '../domain/training/Exercise';
import type { PlatformWorkout } from '../domain/training/PlatformWorkout';
import { Workout } from '../domain/training/Workout';
import { workoutFromPlatform } from './workoutFromPlatform';

/**
 * What a read of the platform's workouts changes in the log (MM-490): the
 * workouts to save. Each platform workout is logged once, as
 * `workoutFromPlatform` gives it, kept with its platform id and source. One
 * already logged is never added again: read again, its day and span follow
 * the platform and its sets stay as the user has them. One this app wrote is
 * not imported, and one deleted in the app (`deleted`) stays deleted.
 */
export function platformWorkoutImports({
  platform,
  logged,
  deleted,
  library,
}: {
  platform: readonly PlatformWorkout[];
  logged: readonly Workout[];
  deleted: ReadonlySet<string>;
  library?: readonly Exercise[];
}): Workout[] {
  const byPlatformId = new Map<string, Workout>();
  for (const workout of logged) {
    if (workout.imported !== undefined) byPlatformId.set(workout.imported.platformId, workout);
  }
  const changes: Workout[] = [];
  const seen = new Set<string>();
  for (const read of platform) {
    if (deleted.has(read.platformId) || seen.has(read.platformId)) continue;
    seen.add(read.platformId);
    const workout = library === undefined ? workoutFromPlatform(read) : workoutFromPlatform(read, library);
    if (workout === undefined) continue;
    const imported = { platformId: read.platformId, sourceName: read.sourceName };
    const existing = byPlatformId.get(read.platformId);
    if (existing === undefined) {
      changes.push(
        new Workout({
          id: 0,
          date: workout.date,
          startedAt: workout.startedAt,
          endedAt: workout.endedAt,
          exercises: workout.exercises,
          imported,
        }),
      );
      continue;
    }
    const moved =
      existing.startedAt.getTime() !== workout.startedAt.getTime() ||
      existing.endedAt?.getTime() !== workout.endedAt?.getTime() ||
      existing.date !== workout.date;
    if (moved) changes.push(existing.copyWith({ date: workout.date, startedAt: workout.startedAt, endedAt: workout.endedAt }));
  }
  return changes;
}
