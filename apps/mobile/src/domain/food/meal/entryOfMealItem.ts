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
 * measured as the item says, by photo estimate when it does not say (the
 * assistant's own item; MM-646), and carries its meal and where its numbers
 * came from. `item` must have every number `mealItemProblems` asks for.
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
  const method = item.method ?? 'photoEstimate';
  return new FoodEntry({
    id,
    date,
    meal,
    name: item.name.trim(),
    kcal,
    proteinG,
    carbsG,
    fatG,
    source: method,
    portion: {
      method,
      basis: 'calculated',
      quantity: grams,
      unit: 'gram',
      // The usual portion is the food's serving (MM-595), so logging it again from the log offers it.
      reference: {
        basis: 'per100g',
        nutrition: totals.times(100 / grams),
        servingDescription: item.usualPortion?.description,
        servingGrams: item.usualPortion?.grams,
      },
    },
    fiberG: item.fiberG,
    micros: item.micros,
    eatenAt,
    loggedMeal,
    evidence: item.evidence,
  });
}
