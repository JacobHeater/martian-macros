import type { Exercise } from '../domain/training/Exercise';
import type { PlatformWorkout } from '../domain/training/PlatformWorkout';
import { Workout } from '../domain/training/Workout';
import { workoutFromPlatform } from './workoutFromPlatform';

/** How much of the shorter of two spans must overlap for them to be one session (MM-490). */
const sameSessionOverlap = 0.8;

/** The share of the shorter span that `a` and `b` overlap, 0 when either has no length. */
function overlapShare(a: { start: number; end: number }, b: { start: number; end: number }): number {
  const shorter = Math.min(a.end - a.start, b.end - b.start);
  if (!(shorter > 0)) return 0;
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start)) / shorter;
}

/**
 * What a read of the platform's workouts changes in the log (MM-490): the
 * workouts to save. Each platform workout is logged once, as
 * `workoutFromPlatform` gives it, kept with its platform id and source. One
 * already logged is never added again: read again, its span follows the
 * platform and its sets stay as the user has them; its day changes only when
 * its start or end did, so a day the user set is kept. One this app wrote is
 * not imported, and one deleted in the app (`deleted`) stays deleted.
 *
 * The same session recorded twice is imported once: a new one whose span
 * overlaps `sameSessionOverlap` of the shorter of its span and that of a
 * workout logged in the app, or of one imported from another source, is
 * left out (a session timed live in the app and also recorded by a watch).
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
  // Every span already in the log, or brought in by this read, with the source it came from (none: logged in the app).
  const spans: { start: number; end: number; source: string | undefined }[] = [];
  for (const workout of logged) {
    if (workout.endedAt === undefined) continue;
    spans.push({ start: workout.startedAt.getTime(), end: workout.endedAt.getTime(), source: workout.imported?.sourceName });
  }
  for (const read of platform) {
    if (deleted.has(read.platformId) || seen.has(read.platformId)) continue;
    seen.add(read.platformId);
    const workout = library === undefined ? workoutFromPlatform(read) : workoutFromPlatform(read, library);
    if (workout === undefined) continue;
    const imported = { platformId: read.platformId, sourceName: read.sourceName };
    const existing = byPlatformId.get(read.platformId);
    if (existing === undefined) {
      const span = { start: read.start.getTime(), end: read.end.getTime() };
      const duplicate = spans.some(
        (other) => (other.source === undefined || other.source !== read.sourceName) && overlapShare(span, other) >= sameSessionOverlap,
      );
      if (duplicate) continue;
      spans.push({ ...span, source: read.sourceName });
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
    // Moved only when its start or end did: the same instants keep the day stored, which the user may have set.
    const moved =
      existing.startedAt.getTime() !== workout.startedAt.getTime() || existing.endedAt?.getTime() !== workout.endedAt?.getTime();
    if (moved) changes.push(existing.copyWith({ date: workout.date, startedAt: workout.startedAt, endedAt: workout.endedAt }));
  }
  return changes;
}
