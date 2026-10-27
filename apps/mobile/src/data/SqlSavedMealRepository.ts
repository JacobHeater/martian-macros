import type { CalendarDate } from '../domain/CalendarDate';
import type { SavedMeal } from '../domain/food/meal/SavedMeal';
import type { FoodEntry } from '../domain/FoodEntry';
import type { SavedMealRepository } from '../domain/repositories/SavedMealRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { integer, text } from './columns';
import { foodEntryValues } from './foodEntryValues';
import { foodFromRow } from './foodFromRow';
import { insert } from './insert';

const both = ['saved_meals', 'saved_meal_foods'] as const;

/** `SavedMealRepository` kept in the database (MM-645): a meal's row, and a row per food as a food's is kept. */
export class SqlSavedMealRepository implements SavedMealRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchSavedMeals(): Watched<SavedMeal[]> {
    return this.db.watch(both, async (db) => {
      const meals = await db.select('SELECT * FROM saved_meals ORDER BY id DESC');
      const rows = await db.select('SELECT * FROM saved_meal_foods ORDER BY saved_meal_id, position');
      const foods = new Map<number, FoodEntry[]>();
      for (const row of rows) {
        const mealId = integer(row, 'saved_meal_id');
        const food = foodFromRow(row);
        const list = foods.get(mealId);
        if (list === undefined) foods.set(mealId, [food]);
        else list.push(food);
      }
      return meals.map((row) => ({ id: integer(row, 'id'), name: text(row, 'name'), foods: foods.get(integer(row, 'id')) ?? [] }));
    });
  }

  saveMeal(name: string, foods: readonly FoodEntry[], on: CalendarDate): Promise<number> {
    return this.db.write(both, async (db) => {
      const id = await insert(db, 'saved_meals', { name, saved_epoch_day: on.epochDay });
      let position = 0;
      for (const food of foods) {
        await insert(db, 'saved_meal_foods', {
          saved_meal_id: id,
          position: position++,
          // A saved meal's foods are loose (the owner's D-2): the meal they were one of is not kept.
          ...foodEntryValues(food.copyWith({ loggedMeal: undefined })),
        });
      }
      return id;
    });
  }

  deleteSavedMeal(id: number): Promise<void> {
    return this.db.write(both, async (db) => {
      await db.execute('DELETE FROM saved_meal_foods WHERE saved_meal_id = ?', [id]);
      await db.execute('DELETE FROM saved_meals WHERE id = ?', [id]);
    });
  }
}
