import { CalendarDate } from '../domain/CalendarDate';
import { builtInExercises } from '../domain/training/builtInExercises';
import { Exercise } from '../domain/training/Exercise';
import type { PlatformWorkout } from '../domain/training/PlatformWorkout';
import { Workout } from '../domain/training/Workout';
import { WorkoutExercise } from '../domain/training/WorkoutExercise';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import { segmentExerciseId } from './segmentExerciseId';
import { workoutClientIdPrefix } from './workoutClientIdPrefix';

/** `EXERCISE_SEGMENT_TYPE_PAUSE` and `_REST`: time in a session, not an exercise. */
const notExercises = new Set([39, 44]);

/**
 * A workout from a health platform as the app logs it (MM-189), unsaved;
 * or undefined for one this app wrote, so it is not imported back.
 *
 * It keeps the session's span. In a strength session each segment becomes
 * a set of the exercise the library places it as, with the platform's
 * repetitions and weight where it gave them (zero where it did not, for
 * the user to edit), and back-to-back segments of one exercise are one
 * exercise's sets. A segment the library cannot place becomes "Other
 * exercise" with its time. Pauses and rests are not exercises. Any other
 * kind of session has no exercises; the user can add sets to it.
 */
export function workoutFromPlatform(
  platform: PlatformWorkout,
  library: readonly Exercise[] = builtInExercises,
): Workout | undefined {
  if (platform.clientId?.startsWith(workoutClientIdPrefix) === true) return undefined;
  const runs: { key: string; exerciseId: string; sets: WorkoutSet[] }[] = [];
  if (platform.strength) {
    const inOrder = [...platform.segments].sort((a, b) => a.start.getTime() - b.start.getTime());
    for (const segment of inOrder) {
      if (notExercises.has(segment.segmentId)) continue;
      const placed = segmentExerciseId(segment.segmentId, library);
      const exerciseId = placed ?? Exercise.otherId;
      const key = placed ?? `${Exercise.otherId}:${segment.segmentId}`;
      const set = new WorkoutSet({
        reps: segment.repetitions ?? 0,
        loadKg: segment.weightKg ?? 0,
        startedAt: segment.start,
        endedAt: segment.end,
      });
      const last = runs[runs.length - 1];
      if (last !== undefined && last.key === key) last.sets.push(set);
      else runs.push({ key, exerciseId, sets: [set] });
    }
  }
  return new Workout({
    id: 0,
    date: CalendarDate.fromDate(platform.start),
    startedAt: platform.start,
    endedAt: platform.end,
    exercises: runs.map((run) => new WorkoutExercise({ exerciseId: run.exerciseId, sets: run.sets })),
  });
}
