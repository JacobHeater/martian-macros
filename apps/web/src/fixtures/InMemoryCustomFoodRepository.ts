import { CustomFood } from '../domain/food/custom/CustomFood';
import type { CustomFoodRepository } from '../domain/repositories/CustomFoodRepository';
import { compareStrings } from '../lang/compareStrings';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

function withId(f: CustomFood, id: number): CustomFood {
  return new CustomFood({
    id,
    name: f.name,
    kind: f.kind,
    servingDescription: f.servingDescription,
    perServing: f.perServing,
    servingGrams: f.servingGrams,
    barcode: f.barcode,
    servings: f.servings,
    cookedWeightGrams: f.cookedWeightGrams,
    ingredients: f.ingredients,
  });
}

/**
 * `CustomFoodRepository` held in memory. Ids count up from 1 and are never
 * reused.
 */
export class InMemoryCustomFoodRepository implements CustomFoodRepository {
  private readonly foods = new ObservableValue<readonly CustomFood[]>([]);
  private nextId = 1;

  watchCustomFoods(): Watched<CustomFood[]> {
    return this.foods.watchAs((all) =>
      [...all].sort((a, b) => {
        const byName = compareStrings(a.name, b.name);
        return byName !== 0 ? byName : a.id - b.id;
      }),
    );
  }

  async saveCustomFood(food: CustomFood): Promise<number> {
    if (food.id === 0) {
      const id = this.nextId++;
      this.foods.value = [...this.foods.value, withId(food, id)];
      return id;
    }
    this.foods.value = this.foods.value.map((f) => (f.id === food.id ? withId(food, food.id) : f));
    return food.id;
  }

  async deleteCustomFood(id: number): Promise<void> {
    this.foods.value = this.foods.value.filter((f) => f.id !== id);
  }

  /** Empties the list. Ids keep counting, as in the database. */
  clear(): void {
    this.foods.value = [];
  }
}
