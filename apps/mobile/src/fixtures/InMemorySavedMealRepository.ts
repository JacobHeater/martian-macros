import type { CalendarDate } from '../domain/CalendarDate';
import type { SavedMeal } from '../domain/food/meal/SavedMeal';
import type { FoodEntry } from '../domain/FoodEntry';
import type { SavedMealRepository } from '../domain/repositories/SavedMealRepository';
import { ObservableValue } from './ObservableValue';
import type { Watched } from '../lang/Watched';

/** `SavedMealRepository` held in memory (MM-645). Ids count up from 1 and are never reused. */
export class InMemorySavedMealRepository implements SavedMealRepository {
  private readonly meals = new ObservableValue<readonly SavedMeal[]>([]);
  private nextId = 1;

  watchSavedMeals(): Watched<SavedMeal[]> {
    return this.meals.watchAs((all) => [...all].reverse());
  }

  async saveMeal(name: string, foods: readonly FoodEntry[], _on: CalendarDate): Promise<number> {
    const id = this.nextId++;
    // A saved meal's foods are loose (the owner's D-2); each has an id of its own, as a row does.
    const kept = foods.map((food, i) => food.copyWith({ id: i + 1, loggedMeal: undefined }));
    this.meals.value = [...this.meals.value, { id, name, foods: kept }];
    return id;
  }

  async deleteSavedMeal(id: number): Promise<void> {
    this.meals.value = this.meals.value.filter((meal) => meal.id !== id);
  }

  /** Empties it, as erasing all data does. */
  clear(): void {
    this.meals.value = [];
  }
}
