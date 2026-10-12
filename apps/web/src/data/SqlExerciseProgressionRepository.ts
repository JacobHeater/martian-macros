import type { ExerciseProgressionRepository } from '../domain/repositories/ExerciseProgressionRepository';
import { ExerciseProgression } from '../domain/training/ExerciseProgression';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { integer, optionalNumber, orNull, text } from './columns';
import { upsert } from './statements';

/** `ExerciseProgressionRepository` kept in the database. */
export class SqlExerciseProgressionRepository implements ExerciseProgressionRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchExerciseProgressions(): Watched<ExerciseProgression[]> {
    return this.db.watch(['exercise_progressions'], async (db) =>
      (await db.select('SELECT * FROM exercise_progressions ORDER BY exercise_id')).map(
        (row) =>
          new ExerciseProgression({
            exerciseId: text(row, 'exercise_id'),
            repsLow: integer(row, 'reps_low'),
            repsHigh: integer(row, 'reps_high'),
            loadStepKg: optionalNumber(row, 'load_step_kg'),
          }),
      ),
    );
  }

  saveExerciseProgression(progression: ExerciseProgression): Promise<void> {
    return this.db.write(['exercise_progressions'], (db) =>
      upsert(db, 'exercise_progressions', ['exercise_id'], {
        exercise_id: progression.exerciseId,
        reps_low: progression.repsLow,
        reps_high: progression.repsHigh,
        load_step_kg: orNull(progression.loadStepKg),
      }),
    );
  }

  clearExerciseProgression(exerciseId: string): Promise<void> {
    return this.db.write(['exercise_progressions'], (db) =>
      db.execute('DELETE FROM exercise_progressions WHERE exercise_id = ?', [exerciseId]),
    );
  }
}
