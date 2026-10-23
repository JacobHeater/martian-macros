import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodRepository } from '../domain/repositories/FoodRepository';
import type { HealthIntakeWriter } from '../healthIngest/HealthIntakeWriter';
import type { HealthWriteNamespace } from '../healthIngest/HealthWriteNamespace';
import type { Watched } from '../lang/Watched';
import { foodRecordId } from './foodRecordId';
import { nutritionRecordOf } from './nutritionRecordOf';

/**
 * The food log, told to the phone's health platform as it changes (MM-70):
 * a food logged is written, a food changed is written again under its id,
 * and a food removed is removed there too. The app's log is saved first and
 * is the same whatever the platform does; writing only happens while
 * writing food is on, and a refusal is not an error.
 */
export class MirroredFoodLog implements FoodRepository {
  private readonly log: FoodRepository;
  private readonly platform: HealthIntakeWriter & HealthWriteNamespace;

  constructor({ log, platform }: { log: FoodRepository; platform: HealthIntakeWriter & HealthWriteNamespace }) {
    this.log = log;
    this.platform = platform;
  }

  watchFood(date: CalendarDate): Watched<FoodEntry[]> {
    return this.log.watchFood(date);
  }

  watchFoodBetween(first: CalendarDate, last: CalendarDate): Watched<FoodEntry[]> {
    return this.log.watchFoodBetween(first, last);
  }

  watchRecentFoods(options?: { limit?: number }): Watched<FoodEntry[]> {
    return this.log.watchRecentFoods(options);
  }

  lastLoggedFrom(packId: string, foodIds: readonly number[]): Promise<FoodEntry | undefined> {
    return this.log.lastLoggedFrom(packId, foodIds);
  }

  async addFood(entry: FoodEntry): Promise<number> {
    const id = await this.log.addFood(entry);
    await this.tell((namespace) => this.platform.writeNutrition(nutritionRecordOf(entry, id, namespace)));
    return id;
  }

  async updateFood(entry: FoodEntry): Promise<void> {
    await this.log.updateFood(entry);
    await this.tell((namespace) => this.platform.writeNutrition(nutritionRecordOf(entry, entry.id, namespace)));
  }

  async deleteFood(id: number): Promise<void> {
    await this.log.deleteFood(id);
    await this.tell((namespace) => this.platform.removeNutrition(foodRecordId(namespace, id)));
  }

  /** Tells the platform under this run's namespace (MM-522); a platform that fails changes nothing here. */
  private async tell(step: (namespace: string) => Promise<boolean>): Promise<boolean> {
    try {
      return await step(await this.platform.writeNamespace());
    } catch {
      return false;
    }
  }
}
