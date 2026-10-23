import { ArgumentError } from '../../../lang/ArgumentError';
import type { CalendarDate } from '../../CalendarDate';
import { FoodEntry } from '../../FoodEntry';
import type { Meal } from '../../Meal';
import { NutritionTotals } from '../portion/NutritionTotals';
import type { LoggedMealTag } from './LoggedMealTag';
import type { MealItemDraft } from './MealItemDraft';

/**
 * The food entry one food of an analysed meal is logged as (MM-586): its
 * numbers for the grams eaten, with those numbers per 100 g as its
 * reference, so it is graded as any weighed food is (MM-382). It is
 * measured by photo estimate, carries its meal and where its numbers came
 * from. `item` must have every number `mealItemProblems` asks for.
 */
export function entryOfMealItem(
  item: MealItemDraft,
  { id = 0, date, meal, eatenAt, loggedMeal }: { id?: number; date: CalendarDate; meal: Meal; eatenAt: number | undefined; loggedMeal: LoggedMealTag },
): FoodEntry {
  const { grams, kcal, proteinG, carbsG, fatG } = item;
  if (grams === undefined || !(grams > 0) || kcal === undefined || proteinG === undefined || carbsG === undefined || fatG === undefined) {
    throw new ArgumentError('A food of a meal is logged with its grams, calories and macros.');
  }
  const totals = new NutritionTotals({ kcal, proteinG, carbsG, fatG });
  return new FoodEntry({
    id,
    date,
    meal,
    name: item.name.trim(),
    kcal,
    proteinG,
    carbsG,
    fatG,
    source: 'photoEstimate',
    portion: {
      method: 'photoEstimate',
      basis: 'calculated',
      quantity: grams,
      unit: 'gram',
      reference: { basis: 'per100g', nutrition: totals.times(100 / grams) },
    },
    fiberG: item.fiberG,
    micros: item.micros,
    eatenAt,
    loggedMeal,
    evidence: item.evidence,
  });
}
