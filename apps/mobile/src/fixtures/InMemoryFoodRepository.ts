import type { CalendarDate } from '../domain/CalendarDate';
import type { LoggedMeal } from '../domain/food/meal/LoggedMeal';
import { recentMealsIn } from '../domain/food/meal/recentMealsIn';
import { FoodEntry } from '../domain/FoodEntry';
import type { FoodRepository } from '../domain/repositories/FoodRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `FoodRepository` held in memory. Ids count up from 1 and are never reused. */
export class InMemoryFoodRepository implements FoodRepository {
  private readonly entries = new ObservableValue<readonly FoodEntry[]>([]);
  private nextId = 1;

  /**
   * Every entry, for implementations that derive from the log (see
   * `InMemoryIntakeReader`).
   */
  watchAll(): Watched<readonly FoodEntry[]> {
    return this.entries.watch();
  }

  watchFood(date: CalendarDate): Watched<FoodEntry[]> {
    return this.entries.watchAs((all) => all.filter((e) => e.date.epochDay === date.epochDay));
  }

  watchFoodBetween(first: CalendarDate, last: CalendarDate): Watched<FoodEntry[]> {
    return this.entries.watchAs((all) =>
      all
        .filter((e) => e.date.epochDay >= first.epochDay && e.date.epochDay <= last.epochDay)
        // Stable: entries of one day stay in the order added.
        .sort((a, b) => a.date.epochDay - b.date.epochDay),
    );
  }

  async addFood(entry: FoodEntry): Promise<number> {
    const id = this.nextId++;
    this.entries.value = [
      ...this.entries.value,
      new FoodEntry({
        id,
        date: entry.date,
        meal: entry.meal,
        name: entry.name,
        kcal: entry.kcal,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
        source: entry.source,
        portion: entry.portion,
        fiberG: entry.fiberG,
        sugarAlcoholsG: entry.sugarAlcoholsG,
        sodiumMg: entry.sodiumMg,
        alcoholG: entry.alcoholG,
        micros: entry.micros,
        eatenAt: entry.eatenAt,
        loggedMeal: entry.loggedMeal,
        evidence: entry.evidence,
      }),
    ];
    return id;
  }

  async updateFood(entry: FoodEntry): Promise<void> {
    this.entries.value = this.entries.value.map((e) => (e.id === entry.id ? entry : e));
  }

  async deleteFood(id: number): Promise<void> {
    this.entries.value = this.entries.value.filter((e) => e.id !== id);
  }

  async lastLoggedFrom(packId: string, foodIds: readonly number[]): Promise<FoodEntry | undefined> {
    const all = this.entries.value;
    for (let i = all.length - 1; i >= 0; i--) {
      const origin = all[i]?.portion?.origin;
      if (origin !== undefined && origin.packId === packId && foodIds.includes(origin.foodId)) return all[i];
    }
    return undefined;
  }

  watchRecentFoods({ limit = 20 }: { limit?: number } = {}): Watched<FoodEntry[]> {
    return this.entries.watchAs((all) => {
      const newestFirst = [...all]
        .reverse()
        .filter((e) => e.loggedMeal === undefined)
        .slice(0, 200);
      const seen = new Set<string>();
      const distinct = newestFirst.filter((e) => {
        const name = e.name.toLowerCase();
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });
      return distinct.slice(0, Math.max(0, limit));
    });
  }

  watchRecentMeals({ limit = 5 }: { limit?: number } = {}): Watched<LoggedMeal[]> {
    return this.entries.watchAs((all) =>
      recentMealsIn(
        [...all].reverse().filter((e) => e.loggedMeal !== undefined).slice(0, 400),
        limit,
      ),
    );
  }

  /** Empties the log. Ids keep counting, as in the database. */
  clear(): void {
    this.entries.value = [];
  }
}
