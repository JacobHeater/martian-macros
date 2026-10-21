import type { GoalBodyFat } from '../domain/GoalBodyFat';
import type { GoalBodyFatRepository } from '../domain/repositories/GoalBodyFatRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `GoalBodyFatRepository` held in memory (MM-36). */
export class InMemoryGoalBodyFatRepository implements GoalBodyFatRepository {
  private readonly goal = new ObservableValue<GoalBodyFat | undefined>(undefined);

  watchGoalBodyFat(): Watched<GoalBodyFat | undefined> {
    return this.goal.watch();
  }

  async saveGoalBodyFat(goal: GoalBodyFat): Promise<void> {
    this.goal.value = goal;
  }

  async clearGoalBodyFat(): Promise<void> {
    this.goal.value = undefined;
  }
}
