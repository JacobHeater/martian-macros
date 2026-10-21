import type { WorkoutRepository } from '../domain/repositories/WorkoutRepository';
import type { ImportedWorkout } from '../domain/training/ImportedWorkout';
import { Workout } from '../domain/training/Workout';
import { WorkoutExercise } from '../domain/training/WorkoutExercise';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import type { Watched } from '../lang/Watched';
import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlRow } from '../sql/SqlRow';
import type { AppDatabase } from './AppDatabase';
import { day, integer, moment, number, optionalInteger, optionalMoment, optionalText, orNull, text } from './columns';
import { insert } from './insert';
import { update } from './update';

// A workout is read from three tables, so it is read again when any changes.
const all = ['workouts', 'workout_exercises', 'workout_sets'] as const;

const secondMs = 1000;

async function deleteChildren(db: SqlDatabase, workoutId: number): Promise<void> {
  await db.execute('DELETE FROM workout_sets WHERE workout_id = ?', [workoutId]);
  await db.execute('DELETE FROM workout_exercises WHERE workout_id = ?', [workoutId]);
}

function pushTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list === undefined) map.set(key, [value]);
  else list.push(value);
}

/** Where an imported workout came from (MM-490), or undefined for one logged in the app. */
function importedOf(row: SqlRow): ImportedWorkout | undefined {
  const platformId = optionalText(row, 'platform_id');
  return platformId === undefined ? undefined : { platformId, sourceName: optionalText(row, 'platform_source_name') ?? '' };
}

/** `WorkoutRepository` kept in the database. Ids are never reused. */
export class SqlWorkoutRepository implements WorkoutRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchWorkouts(): Watched<Workout[]> {
    return this.db.watch(all, async (db) => {
      const rows = await db.select('SELECT * FROM workouts ORDER BY started_at_ms DESC, id DESC');
      const exerciseRows = await db.select('SELECT * FROM workout_exercises ORDER BY position');
      const setRows = await db.select('SELECT * FROM workout_sets ORDER BY position');

      const sets = new Map<string, WorkoutSet[]>();
      for (const row of setRows) {
        pushTo(
          sets,
          `${integer(row, 'workout_id')}/${integer(row, 'exercise_position')}`,
          new WorkoutSet({
            reps: integer(row, 'reps'),
            loadKg: number(row, 'load_kg'),
            rir: optionalInteger(row, 'rir'),
            startedAt: optionalMoment(row, 'started_at_ms'),
            endedAt: optionalMoment(row, 'ended_at_ms'),
          }),
        );
      }
      const exercises = new Map<number, WorkoutExercise[]>();
      for (const row of exerciseRows) {
        const workoutId = integer(row, 'workout_id');
        const restSeconds = optionalInteger(row, 'rest_target_seconds');
        pushTo(
          exercises,
          workoutId,
          new WorkoutExercise({
            exerciseId: text(row, 'exercise_id'),
            sets: sets.get(`${workoutId}/${integer(row, 'position')}`) ?? [],
            restTargetMs: restSeconds === undefined ? undefined : restSeconds * secondMs,
          }),
        );
      }
      return rows.map(
        (row) =>
          new Workout({
            id: integer(row, 'id'),
            date: day(row, 'date_epoch_day'),
            startedAt: moment(row, 'started_at_ms'),
            endedAt: optionalMoment(row, 'ended_at_ms'),
            pausedAt: optionalMoment(row, 'paused_at_ms'),
            pausedForMs: integer(row, 'paused_for_ms'),
            setStartedAt: optionalMoment(row, 'set_started_at_ms'),
            exercises: exercises.get(integer(row, 'id')) ?? [],
            imported: importedOf(row),
          }),
      );
    });
  }

  saveWorkout(workout: Workout): Promise<number> {
    return this.db.write(all, async (db) => {
      const row = {
        date_epoch_day: workout.date.epochDay,
        started_at_ms: workout.startedAt.getTime(),
        ended_at_ms: orNull(workout.endedAt?.getTime()),
        paused_at_ms: orNull(workout.pausedAt?.getTime()),
        paused_for_ms: Math.trunc(workout.pausedForMs),
        set_started_at_ms: orNull(workout.setStartedAt?.getTime()),
        platform_id: orNull(workout.imported?.platformId),
        platform_source_name: orNull(workout.imported?.sourceName),
      };
      let id = workout.id;
      if (id === 0) {
        id = await insert(db, 'workouts', row);
      } else {
        await update(db, 'workouts', row, { column: 'id', value: id });
        await deleteChildren(db, id);
      }
      for (const [e, exercise] of workout.exercises.entries()) {
        const restMs = exercise.restTargetMs;
        await insert(db, 'workout_exercises', {
          workout_id: id,
          position: e,
          exercise_id: exercise.exerciseId,
          // Whole seconds, as the rest timer counts them.
          rest_target_seconds: restMs === undefined ? null : Math.trunc(restMs / secondMs),
        });
        for (const [s, set] of exercise.sets.entries()) {
          await insert(db, 'workout_sets', {
            workout_id: id,
            exercise_position: e,
            position: s,
            reps: set.reps,
            load_kg: set.loadKg,
            rir: orNull(set.rir),
            started_at_ms: orNull(set.startedAt?.getTime()),
            ended_at_ms: orNull(set.endedAt?.getTime()),
          });
        }
      }
      return id;
    });
  }

  deleteWorkout(id: number): Promise<void> {
    return this.db.write([...all, 'deleted_platform_workouts'], async (db) => {
      // An imported workout's platform id is kept, so a later read does not bring it back (MM-490).
      await db.execute(
        'INSERT OR IGNORE INTO deleted_platform_workouts (platform_id) SELECT platform_id FROM workouts WHERE id = ? AND platform_id IS NOT NULL',
        [id],
      );
      await deleteChildren(db, id);
      await db.execute('DELETE FROM workouts WHERE id = ?', [id]);
    });
  }

  async deletedPlatformIds(): Promise<ReadonlySet<string>> {
    const rows = await this.db.read((db) => db.select('SELECT platform_id FROM deleted_platform_workouts'));
    return new Set(rows.map((row) => text(row, 'platform_id')));
  }
}
