import type { FoodEntry } from '../../FoodEntry';

/**
 * The usual serving an entry can be compared with (MM-365): the label's
 * serving of a packaged food, the saved serving of the person's own food or
 * recipe, or the serving a typed food was given, each logged by counting
 * servings. None for a food logged by weight or a household measure (a cup
 * of rice is a measure, not an amount eaten), a hand portion (a portion by
 * construction), an estimate, or an entry from before portions were kept.
 */
export function usualServing(entry: FoodEntry): { servings: number; servingGrams: number | undefined } | undefined {
  const portion = entry.portion;
  if (portion === undefined || portion.unit !== 'serving' || portion.quantity === undefined || portion.quantity <= 0) {
    return undefined;
  }
  return { servings: portion.quantity, servingGrams: portion.reference?.servingGrams };
}
