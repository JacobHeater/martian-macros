import type { MealItemDraft } from './MealItemDraft';

const times = (value: number | undefined, factor: number) => (value === undefined ? undefined : value * factor);

/**
 * `item` at `grams` (MM-586): every number scaled with the weight, so the
 * food is the same and only the amount changes. Where its numbers came from
 * stays, since they are still that source's per gram. An item whose grams
 * were not known takes the new grams and keeps its numbers.
 */
export function mealItemWithGrams(item: MealItemDraft, grams: number): MealItemDraft {
  const before = item.grams;
  if (before === undefined || !(before > 0) || !(grams > 0)) return { ...item, grams };
  const factor = grams / before;
  return {
    ...item,
    grams,
    kcal: times(item.kcal, factor),
    proteinG: times(item.proteinG, factor),
    carbsG: times(item.carbsG, factor),
    fatG: times(item.fatG, factor),
    fiberG: times(item.fiberG, factor),
    micros: item.micros.times(factor),
  };
}
