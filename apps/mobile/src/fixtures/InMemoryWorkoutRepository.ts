import type { WorkoutRepository } from '../domain/repositories/WorkoutRepository';
import type { Workout } from '../domain/training/Workout';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/**
 * `WorkoutRepository` held in memory. Ids count up from 1 and are never
 * reused.
 */
export class InMemoryWorkoutRepository implements WorkoutRepository {
  private readonly workouts = new ObservableValue<readonly Workout[]>([]);
  private nextId = 1;
  private readonly deleted = new Set<string>();

  watchWorkouts(): Watched<Workout[]> {
    return this.workouts.watchAs((all) =>
      [...all].sort((a, b) => {
        const byStart = b.startedAt.getTime() - a.startedAt.getTime();
        return byStart !== 0 ? byStart : b.id - a.id;
      }),
    );
  }

  async saveWorkout(workout: Workout): Promise<number> {
    if (workout.id === 0) {
      const id = this.nextId++;
      this.workouts.value = [...this.workouts.value, workout.copyWith({ id })];
      return id;
    }
    this.workouts.value = this.workouts.value.map((existing) => (existing.id === workout.id ? workout : existing));
    return workout.id;
  }

  async deleteWorkout(id: number): Promise<void> {
    const platformId = this.workouts.value.find((existing) => existing.id === id)?.imported?.platformId;
    if (platformId !== undefined) this.deleted.add(platformId);
    this.workouts.value = this.workouts.value.filter((existing) => existing.id !== id);
  }

  async deletedPlatformIds(): Promise<ReadonlySet<string>> {
    return new Set(this.deleted);
  }

  /**
   * Empties the store (used by `InMemoryDataEraser`). Ids keep counting, as
   * in the database.
   */
  clear(): void {
    this.workouts.value = [];
    this.deleted.clear();
  }
}
