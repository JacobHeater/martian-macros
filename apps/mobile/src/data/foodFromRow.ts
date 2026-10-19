import { FoodEntry } from '../domain/FoodEntry';
import { Meal } from '../domain/Meal';
import { QuantitySource } from '../domain/QuantitySource';
import type { SqlRow } from '../sql/SqlRow';
import { day, integer, named, number, optionalNumber, text } from './columns';
import { microsFromRow } from './microsFromRow';
import { portionFromRow } from './portionFromRow';

/** The food entry a row of the food log holds. */
export function foodFromRow(r: SqlRow): FoodEntry {
  return new FoodEntry({
    id: integer(r, 'id'),
    date: day(r, 'epoch_day'),
    meal: named(Meal.values, r, 'meal'),
    name: text(r, 'name'),
    kcal: number(r, 'kcal'),
    proteinG: number(r, 'protein_g'),
    carbsG: number(r, 'carbs_g'),
    fatG: number(r, 'fat_g'),
    source: named(QuantitySource.values, r, 'quantity_source'),
    portion: portionFromRow(r),
    fiberG: optionalNumber(r, 'fiber_g'),
    sugarAlcoholsG: optionalNumber(r, 'sugar_alcohols_g'),
    sodiumMg: optionalNumber(r, 'sodium_mg'),
    alcoholG: optionalNumber(r, 'alcohol_g'),
    micros: microsFromRow(r),
  });
}
