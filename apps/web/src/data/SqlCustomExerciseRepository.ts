import type { CustomExerciseRepository } from '../domain/repositories/CustomExerciseRepository';
import { Equipment } from '../domain/training/Equipment';
import { Exercise } from '../domain/training/Exercise';
import { ExerciseLoad } from '../domain/training/ExerciseLoad';
import { MuscleGroup } from '../domain/training/MuscleGroup';
import { byName } from '../lang/byName';
import { tryParseInt } from '../lang/tryParseInt';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { integer, named, text } from './columns';
import { insert, update } from './statements';

/** The row a custom exercise's id names, or undefined for an id that is not one of ours. */
const rowIdOf = (id: string) =>
  id.startsWith(Exercise.customIdPrefix) ? tryParseInt(id.substring(Exercise.customIdPrefix.length)) : undefined;

/** `CustomExerciseRepository` kept in the database. Ids are never reused. */
export class SqlCustomExerciseRepository implements CustomExerciseRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchCustomExercises(): Watched<Exercise[]> {
    return this.db.watch(['custom_exercises'], async (db) =>
      (await db.select('SELECT * FROM custom_exercises ORDER BY lower(name), id')).map(
        (row) =>
          new Exercise({
            id: `${Exercise.customIdPrefix}${integer(row, 'id')}`,
            name: text(row, 'name'),
            equipment: named(Equipment.values, row, 'equipment'),
            primary: named(MuscleGroup.values, row, 'primary_muscle'),
            secondary: text(row, 'secondary_muscles')
              .split(',')
              .filter((name) => name !== '')
              .map((name) => byName(MuscleGroup.values, name)),
            load: named(ExerciseLoad.values, row, 'load_kind'),
          }),
      ),
    );
  }

  saveCustomExercise(exercise: Exercise): Promise<string> {
    const row = {
      name: exercise.name,
      equipment: exercise.equipment,
      primary_muscle: exercise.primary,
      secondary_muscles: exercise.secondary.join(','),
      load_kind: exercise.load,
    };
    return this.db.write(['custom_exercises'], async (db) => {
      if (exercise.id === '') return `${Exercise.customIdPrefix}${await insert(db, 'custom_exercises', row)}`;
      const rowId = rowIdOf(exercise.id);
      if (rowId !== undefined) await update(db, 'custom_exercises', row, { column: 'id', value: rowId });
      return exercise.id;
    });
  }

  async deleteCustomExercise(id: string): Promise<void> {
    const rowId = rowIdOf(id);
    if (rowId === undefined) return;
    await this.db.write(['custom_exercises'], (db) => db.execute('DELETE FROM custom_exercises WHERE id = ?', [rowId]));
  }
}
