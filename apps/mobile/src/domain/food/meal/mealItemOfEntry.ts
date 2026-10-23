import type { FoodEntry } from '../../FoodEntry';
import type { MealItemDraft } from './MealItemDraft';

/** A logged food of a meal as an item to change (MM-587): its grams, when it was logged by weight, and its numbers. */
export function mealItemOfEntry(entry: FoodEntry): MealItemDraft {
  const portion = entry.portion;
  return {
    name: entry.name,
    grams: portion?.unit === 'gram' ? portion.quantity : undefined,
    kcal: entry.kcal,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
    fiberG: entry.fiberG,
    micros: entry.micros,
    evidence: entry.evidence ?? { kind: 'yours' },
  };
}
