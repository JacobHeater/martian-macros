import type { FoodEntry } from '../domain/FoodEntry';
import { orNull } from './columns';
import { microsValues } from './microsValues';
import { portionValues } from './portionValues';
import type { Values } from './Values';

/** A food entry as the columns of its row, but its id, as both the food log and saved meals keep it (MM-645). */
export const foodEntryValues = (entry: FoodEntry): Values => ({
  epoch_day: entry.date.epochDay,
  meal: entry.meal,
  name: entry.name,
  kcal: entry.kcal,
  protein_g: entry.proteinG,
  carbs_g: entry.carbsG,
  fat_g: entry.fatG,
  quantity_source: entry.source,
  fiber_g: orNull(entry.fiberG),
  sugar_alcohols_g: orNull(entry.sugarAlcoholsG),
  sodium_mg: orNull(entry.sodiumMg),
  alcohol_g: orNull(entry.alcoholG),
  eaten_at_minute: orNull(entry.eatenAt),
  logged_meal_key: orNull(entry.loggedMeal?.key),
  logged_meal_name: orNull(entry.loggedMeal?.name),
  evidence_kind: orNull(entry.evidence?.kind),
  evidence_citation: orNull(entry.evidence?.citation),
  ...microsValues(entry.micros),
  ...portionValues(entry.portion),
});
