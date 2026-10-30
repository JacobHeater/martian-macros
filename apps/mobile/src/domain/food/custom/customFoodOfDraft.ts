import { FoodGroup } from '../FoodGroup';
import { NutritionTotals } from '../portion/NutritionTotals';
import { CustomFood } from './CustomFood';
import type { FoodDraft } from './FoodDraft';

/**
 * The saved food a draft becomes (MM-709): its per-100 g numbers scaled to
 * its serving, as a saved food keeps them (MM-45), with its group, its
 * evidence and its ingredients (MM-710). Only a draft with no problems is
 * handed in; a missing number is taken as 0 so the food is still whole.
 * With `id`, the food replaces the saved one of that id.
 */
export function customFoodOfDraft(draft: FoodDraft, id = 0): CustomFood {
  const grams = draft.servingGrams ?? 100;
  const factor = grams / 100;
  const scaled = (value: number | undefined) => (value ?? 0) * factor;
  return new CustomFood({
    id,
    name: draft.name.trim(),
    kind: 'food',
    servingDescription: draft.servingDescription ?? `${grams} g`,
    servingGrams: grams,
    perServing: new NutritionTotals({ kcal: scaled(draft.kcal), proteinG: scaled(draft.proteinG), carbsG: scaled(draft.carbsG), fatG: scaled(draft.fatG) }),
    barcode: draft.barcode,
    fiberG: scaled(draft.fiberG),
    sugarAlcoholsG: scaled(draft.sugarAlcoholsG),
    micros: draft.micros.times(factor),
    group: FoodGroup.fromName(draft.group),
    evidence: draft.evidence,
    madeOf: draft.ingredients,
  });
}
