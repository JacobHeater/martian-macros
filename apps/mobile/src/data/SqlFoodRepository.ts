import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodRepository } from '../domain/repositories/FoodRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { orNull } from './columns';
import { foodFromRow } from './foodFromRow';
import { portionValues } from './portionValues';
import { insert } from './insert';
import { update } from './update';
import type { Values } from './Values';

const valuesOf = (entry: FoodEntry): Values => ({
  epoch_day: entry.date.epochDay,
  meal: entry.meal,
  name: entry.name,
  kcal: entry.kcal,
  protein_g: entry.proteinG,
  carbs_g: entry.carbsG,
  fat_g: entry.fatG,
  quantity_source: entry.source,
  fiber_g: orNull(entry.fiberG),
  sodium_mg: orNull(entry.sodiumMg),
  alcohol_g: orNull(entry.alcoholG),
  ...portionValues(entry.portion),
});

/** `FoodRepository` kept in the database. Ids are never reused. */
export class SqlFoodRepository implements FoodRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchFood(date: CalendarDate): Watched<FoodEntry[]> {
    return this.db.watch(['food_entries'], async (db) =>
      (await db.select('SELECT * FROM food_entries WHERE epoch_day = ? ORDER BY id', [date.epochDay])).map(foodFromRow),
    );
  }

  addFood(entry: FoodEntry): Promise<number> {
    return this.db.write(['food_entries'], (db) => insert(db, 'food_entries', valuesOf(entry)));
  }

  updateFood(entry: FoodEntry): Promise<void> {
    return this.db.write(['food_entries'], (db) =>
      update(db, 'food_entries', valuesOf(entry), { column: 'id', value: entry.id }),
    );
  }

  deleteFood(id: number): Promise<void> {
    return this.db.write(['food_entries'], (db) => db.execute('DELETE FROM food_entries WHERE id = ?', [id]));
  }

  watchRecentFoods({ limit = 20 }: { limit?: number } = {}): Watched<FoodEntry[]> {
    return this.db.watch(['food_entries'], async (db) => {
      const seen = new Set<string>();
      const distinct = (await db.select('SELECT * FROM food_entries ORDER BY id DESC LIMIT 200'))
        .map(foodFromRow)
        .filter((entry) => {
          const name = entry.name.toLowerCase();
          if (seen.has(name)) return false;
          seen.add(name);
          return true;
        });
      return distinct.slice(0, Math.max(0, limit));
    });
  }
}
