import { CalendarDate } from '../../../src/domain/CalendarDate';
import type { FoodGroup } from '../../../src/domain/food/FoodGroup';
import { NutritionTotals } from '../../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../../src/domain/FoodEntry';
import type { Meal } from '../../../src/domain/Meal';
import type { TradeCatalogFood } from '../../../src/engine/analysis/TradeCatalogFood';
import { InMemoryTradeCatalog } from '../../../src/fixtures/InMemoryTradeCatalog';

/** The meal moves' fixtures (MM-684): catalog foods with their groups, and entries logged from them. */

export const packId = 'fixture';
let nextId = 1000;

/** A catalog food at its default serving, in `group`, with its carbohydrate given or the calories left by protein and fat. */
export function catalogFood(
  foodId: number,
  name: string,
  group: FoodGroup,
  kcal: number,
  proteinG: number,
  fatG: number,
  carbsG = Math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4),
): { readonly packId: string; readonly foodId: number; readonly food: TradeCatalogFood } {
  return {
    packId,
    foodId,
    food: { name, group, grams: 100, kcal, proteinG, carbsG, fatG, sodiumMg: undefined, fiberG: undefined, alcoholG: undefined, grade: undefined },
  };
}

/** A catalog over `foods`. */
export function catalogOf(...foods: ReturnType<typeof catalogFood>[]): InMemoryTradeCatalog {
  return new InMemoryTradeCatalog(foods);
}

/** A food logged on `date` at `meal`; from catalog food `fromFoodId` when given, so its group is known. */
export function logged(
  date: CalendarDate,
  meal: Meal,
  name: string,
  kcal: number,
  proteinG: number,
  fatG: number,
  { fromFoodId, carbsG = Math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4) }: { fromFoodId?: number; carbsG?: number } = {},
): FoodEntry {
  return new FoodEntry({
    id: nextId++,
    date,
    meal,
    name,
    kcal,
    proteinG,
    carbsG,
    fatG,
    source: 'labelServing',
    ...(fromFoodId === undefined
      ? {}
      : {
          portion: {
            method: 'labelServing',
            basis: 'calculated',
            quantity: 1,
            unit: 'serving',
            reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal, proteinG, carbsG, fatG }) },
            origin: { packId, foodId: fromFoodId, source: 'fixture' },
          },
        }),
  });
}

export const day = CalendarDate.of(2026, 10, 28);
