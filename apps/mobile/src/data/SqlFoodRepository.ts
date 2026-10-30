import type { CalendarDate } from '../domain/CalendarDate';
import type { LoggedMeal } from '../domain/food/meal/LoggedMeal';
import { distinctByName } from '../domain/food/meal/distinctByName';
import { recentMealsIn } from '../domain/food/meal/recentMealsIn';
import type { SavedFoodUsage } from '../domain/food/custom/SavedFoodUsage';
import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodRepository } from '../domain/repositories/FoodRepository';
import type { Watched } from '../lang/Watched';
import type { SqlRow } from '../sql/SqlRow';
import type { AppDatabase } from './AppDatabase';
import { day, integer } from './columns';
import { foodEntryValues } from './foodEntryValues';
import { foodFromRow } from './foodFromRow';
import { insert } from './insert';
import { update } from './update';

/** A LIKE pattern for names holding `query`, its own % and _ taken literally (MM-596). SQLite's LIKE ignores ASCII case. */
const containing = (query: string) => `%${query.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;


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

  watchFoodBetween(first: CalendarDate, last: CalendarDate): Watched<FoodEntry[]> {
    return this.db.watch(['food_entries'], async (db) =>
      (
        await db.select('SELECT * FROM food_entries WHERE epoch_day BETWEEN ? AND ? ORDER BY epoch_day, id', [
          first.epochDay,
          last.epochDay,
        ])
      ).map(foodFromRow),
    );
  }

  addFood(entry: FoodEntry): Promise<number> {
    return this.db.write(['food_entries'], (db) => insert(db, 'food_entries', foodEntryValues(entry)));
  }

  updateFood(entry: FoodEntry): Promise<void> {
    return this.db.write(['food_entries'], (db) =>
      update(db, 'food_entries', foodEntryValues(entry), { column: 'id', value: entry.id }),
    );
  }

  deleteFood(id: number): Promise<void> {
    return this.db.write(['food_entries'], (db) => db.execute('DELETE FROM food_entries WHERE id = ?', [id]));
  }

  applyFoodChanges(changes: {
    readonly add?: readonly FoodEntry[];
    readonly update?: readonly FoodEntry[];
    readonly delete?: readonly number[];
  }): Promise<number[]> {
    const { add = [], update: updates = [], delete: deletes = [] } = changes;
    // One transaction and one notice to the watchers (MM-625): a meal goes, comes back or moves whole.
    return this.db.write(['food_entries'], async (db) => {
      const touched = [...new Set([...updates.map((entry) => entry.id), ...deletes])];
      if (touched.length > 0) {
        const found = await db.select(`SELECT id FROM food_entries WHERE id IN (${touched.map(() => '?').join(', ')})`, touched);
        if (found.length !== touched.length) throw new Error('A food to change is no longer in the log.');
      }
      const ids: number[] = [];
      for (const entry of add) ids.push(await insert(db, 'food_entries', foodEntryValues(entry)));
      for (const entry of updates) await update(db, 'food_entries', foodEntryValues(entry), { column: 'id', value: entry.id });
      for (const id of deletes) await db.execute('DELETE FROM food_entries WHERE id = ?', [id]);
      return ids;
    });
  }

  async lastLoggedFrom(packId: string, foodIds: readonly number[]): Promise<FoodEntry | undefined> {
    if (foodIds.length === 0) return undefined;
    const rows = await this.db.read((db) =>
      db.select(
        `SELECT * FROM food_entries WHERE origin_pack_id = ? AND origin_food_id IN (${foodIds.map(() => '?').join(', ')}) ` +
          'ORDER BY id DESC LIMIT 1',
        [packId, ...foodIds],
      ),
    );
    return rows.length === 0 ? undefined : foodFromRow(rows[0] as SqlRow);
  }

  watchSavedFoodUsage(): Watched<ReadonlyMap<number, SavedFoodUsage>> {
    return this.db.watch(['food_entries'], async (db) => {
      // An entry logged from one of the person's own foods carries its id as its origin (MM-167, `custom`).
      const rows = await db.select(
        "SELECT origin_food_id AS food_id, COUNT(*) AS times, MAX(epoch_day) AS last_day FROM food_entries " +
          "WHERE origin_pack_id = 'custom' AND origin_food_id IS NOT NULL GROUP BY origin_food_id",
      );
      return new Map(rows.map((row) => [integer(row, 'food_id'), { times: integer(row, 'times'), lastDay: day(row, 'last_day') }]));
    });
  }

  watchRecentFoods({ limit = 20 }: { limit?: number } = {}): Watched<FoodEntry[]> {
    return this.db.watch(['food_entries'], async (db) => {
      const seen = new Set<string>();
      // A meal's foods are offered as the meal (MM-587), not one by one.
      const distinct = (await db.select('SELECT * FROM food_entries WHERE logged_meal_key IS NULL ORDER BY id DESC LIMIT 200'))
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

  watchRecentMeals({ limit = 5 }: { limit?: number } = {}): Watched<LoggedMeal[]> {
    return this.db.watch(['food_entries'], async (db) =>
      recentMealsIn(
        (await db.select('SELECT * FROM food_entries WHERE logged_meal_key IS NOT NULL ORDER BY id DESC LIMIT 400')).map(foodFromRow),
        limit,
      ),
    );
  }

  async searchLoggedFoods(query: string, { limit = 25 }: { limit?: number } = {}): Promise<FoodEntry[]> {
    const rows = await this.db.read((db) =>
      db.select("SELECT * FROM food_entries WHERE name LIKE ? ESCAPE '\\' ORDER BY id DESC", [containing(query)]),
    );
    return distinctByName(rows.map(foodFromRow), limit);
  }

  async searchLoggedMeals(query: string, { limit = 10 }: { limit?: number } = {}): Promise<LoggedMeal[]> {
    const rows = await this.db.read((db) =>
      db.select("SELECT * FROM food_entries WHERE logged_meal_name LIKE ? ESCAPE '\\' ORDER BY id DESC", [containing(query)]),
    );
    return recentMealsIn(rows.map(foodFromRow), limit);
  }
}
