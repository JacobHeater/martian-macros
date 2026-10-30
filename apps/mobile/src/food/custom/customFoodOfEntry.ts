import { CustomFood } from '../../domain/food/custom/CustomFood';
import { Micronutrient } from '../../domain/food/micros/Micronutrient';
import { Micronutrients } from '../../domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import type { FoodEntry } from '../../domain/FoodEntry';
import { portionAmount } from '../../format/portionAmount';

/**
 * A logged food as one of the person's own, not yet saved (MM-706, "Save as
 * a food" on a usual food): one serving is the amount that was logged, with
 * its numbers, so it logs again as it was eaten. The weight is the entry's
 * when it is known; otherwise the food is logged by servings only (MM-45).
 */
export function customFoodOfEntry(entry: FoodEntry): CustomFood {
  const portion = entry.portion;
  const reference = portion?.reference;
  const grams =
    portion?.impliedGrams ??
    (portion?.unit === 'gram' ? portion.quantity : undefined) ??
    (portion?.quantity !== undefined && reference?.servingGrams !== undefined && portion.unit === reference.servingUnit
      ? portion.quantity * reference.servingGrams
      : undefined);
  const micros = new Micronutrients(Object.fromEntries(Micronutrient.values.map((n) => [n, entry.micros.of(n)])));
  return new CustomFood({
    id: 0,
    name: entry.name,
    kind: 'food',
    servingDescription: portionAmount(entry) ?? '1 serving',
    servingGrams: grams !== undefined && grams > 0 ? grams : undefined,
    perServing: new NutritionTotals({ kcal: entry.kcal, proteinG: entry.proteinG, carbsG: entry.carbsG, fatG: entry.fatG }),
    fiberG: entry.fiberG,
    sugarAlcoholsG: entry.sugarAlcoholsG,
    micros: entry.sodiumMg === undefined ? micros : micros.with('sodium', entry.sodiumMg),
  });
}
