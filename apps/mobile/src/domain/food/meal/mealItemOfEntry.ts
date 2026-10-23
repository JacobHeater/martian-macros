import type { FoodEntry } from '../../FoodEntry';
import type { MealItemDraft } from './MealItemDraft';
import type { UsualPortion } from './UsualPortion';

/** The usual portion kept as the food's serving (MM-595), when there is one. */
function usualPortionOf(entry: FoodEntry): UsualPortion | undefined {
  const reference = entry.portion?.reference;
  const description = reference?.servingDescription;
  const grams = reference?.servingGrams;
  return description === undefined || grams === undefined ? undefined : { description, grams };
}

/** A logged food of a meal as an item to change (MM-587): its grams, when it was logged by weight, and its numbers. */
export function mealItemOfEntry(entry: FoodEntry): MealItemDraft {
  const portion = entry.portion;
  return {
    name: entry.name,
    grams: portion?.unit === 'gram' ? portion.quantity : undefined,
    usualPortion: usualPortionOf(entry),
    kcal: entry.kcal,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
    fiberG: entry.fiberG,
    micros: entry.micros,
    evidence: entry.evidence ?? { kind: 'yours' },
  };
}
