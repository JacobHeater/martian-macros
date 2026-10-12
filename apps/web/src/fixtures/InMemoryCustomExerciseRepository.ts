import type { CustomExerciseRepository } from '../domain/repositories/CustomExerciseRepository';
import { Exercise } from '../domain/training/Exercise';
import { compareStrings } from '../lang/compareStrings';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/**
 * `CustomExerciseRepository` held in memory. Ids count up from 1 and are
 * never reused.
 */
export class InMemoryCustomExerciseRepository implements CustomExerciseRepository {
  private readonly exercises = new ObservableValue<readonly Exercise[]>([]);
  private nextId = 1;

  watchCustomExercises(): Watched<Exercise[]> {
    return this.exercises.watchAs((all) =>
      [...all].sort((a, b) => {
        const byName = compareStrings(a.name.toLowerCase(), b.name.toLowerCase());
        return byName !== 0 ? byName : compareStrings(a.id, b.id);
      }),
    );
  }

  async saveCustomExercise(exercise: Exercise): Promise<string> {
    if (exercise.id === '') {
      const id = `${Exercise.customIdPrefix}${this.nextId++}`;
      this.exercises.value = [...this.exercises.value, exercise.withId(id)];
      return id;
    }
    this.exercises.value = this.exercises.value.map((existing) => (existing.id === exercise.id ? exercise : existing));
    return exercise.id;
  }

  async deleteCustomExercise(id: string): Promise<void> {
    this.exercises.value = this.exercises.value.filter((existing) => existing.id !== id);
  }

  /**
   * Empties the store (used by `InMemoryDataEraser`). Ids keep counting, as
   * in the database.
   */
  clear(): void {
    this.exercises.value = [];
  }
}
