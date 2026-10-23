import { FoodEvidenceKind } from '../domain/food/meal/FoodEvidenceKind';
import { FoodEntry } from '../domain/FoodEntry';
import { Meal } from '../domain/Meal';
import { QuantitySource } from '../domain/QuantitySource';
import type { FoodEvidence } from '../domain/food/meal/FoodEvidence';
import type { LoggedMealTag } from '../domain/food/meal/LoggedMealTag';
import type { SqlRow } from '../sql/SqlRow';
import { day, integer, named, number, optionalInteger, optionalNamed, optionalNumber, optionalText, text } from './columns';
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
    eatenAt: optionalInteger(r, 'eaten_at_minute'),
    loggedMeal: loggedMealOf(r),
    evidence: evidenceOf(r),
  });
}

/** The meal the food is one of (MM-587), when it has both a key and a name. */
function loggedMealOf(r: SqlRow): LoggedMealTag | undefined {
  const key = optionalText(r, 'logged_meal_key');
  const name = optionalText(r, 'logged_meal_name');
  return key === undefined || name === undefined ? undefined : { key, name };
}

/** Where an analysed meal's food got its numbers (MM-586); none for any other food. */
function evidenceOf(r: SqlRow): FoodEvidence | undefined {
  const kind = optionalNamed(FoodEvidenceKind.values, r, 'evidence_kind');
  return kind === undefined ? undefined : { kind, citation: optionalText(r, 'evidence_citation') };
}
