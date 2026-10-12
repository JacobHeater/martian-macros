import type { ExerciseProgressionRepository } from '../domain/repositories/ExerciseProgressionRepository';
import type { ExerciseProgression } from '../domain/training/ExerciseProgression';
import { compareStrings } from '../lang/compareStrings';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `ExerciseProgressionRepository` held in memory. */
export class InMemoryExerciseProgressionRepository implements ExerciseProgressionRepository {
  private readonly byExercise = new ObservableValue<ReadonlyMap<string, ExerciseProgression>>(new Map());

  watchExerciseProgressions(): Watched<ExerciseProgression[]> {
    return this.byExercise.watchAs((all) =>
      [...all.keys()].sort(compareStrings).map((id) => all.get(id) as ExerciseProgression),
    );
  }

  async saveExerciseProgression(progression: ExerciseProgression): Promise<void> {
    this.byExercise.value = new Map(this.byExercise.value).set(progression.exerciseId, progression);
  }

  async clearExerciseProgression(exerciseId: string): Promise<void> {
    const next = new Map(this.byExercise.value);
    next.delete(exerciseId);
    this.byExercise.value = next;
  }

  clear(): void {
    this.byExercise.value = new Map();
  }
}
