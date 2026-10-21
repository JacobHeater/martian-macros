import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodRepository } from '../domain/repositories/FoodRepository';
import type { HealthIntakeWriter } from '../healthIngest/HealthIntakeWriter';
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
  private readonly platform: HealthIntakeWriter;

  constructor({ log, platform }: { log: FoodRepository; platform: HealthIntakeWriter }) {
    this.log = log;
    this.platform = platform;
  }

  watchFood(date: CalendarDate): Watched<FoodEntry[]> {
    return this.log.watchFood(date);
  }

  watchRecentFoods(options?: { limit?: number }): Watched<FoodEntry[]> {
    return this.log.watchRecentFoods(options);
  }

  lastLoggedFrom(packId: string, foodIds: readonly number[]): Promise<FoodEntry | undefined> {
    return this.log.lastLoggedFrom(packId, foodIds);
  }

  async addFood(entry: FoodEntry): Promise<number> {
    const id = await this.log.addFood(entry);
    await this.platform.writeNutrition(nutritionRecordOf(entry, id)).catch(() => false);
    return id;
  }

  async updateFood(entry: FoodEntry): Promise<void> {
    await this.log.updateFood(entry);
    await this.platform.writeNutrition(nutritionRecordOf(entry, entry.id)).catch(() => false);
  }

  async deleteFood(id: number): Promise<void> {
    await this.log.deleteFood(id);
    await this.platform.removeNutrition(foodRecordId(id)).catch(() => false);
  }
}
