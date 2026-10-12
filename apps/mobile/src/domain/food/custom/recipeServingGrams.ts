/**
 * What one serving weighs: the cooked weight of the whole recipe divided by
 * its servings, or undefined when the cooked weight is not known. Raw
 * ingredient weights are never used: cooking changes weight, not energy.
 */
export function recipeServingGrams(cookedWeightGrams: number | undefined, servings: number): number | undefined {
  if (cookedWeightGrams === undefined || !(cookedWeightGrams > 0) || !(servings > 0)) {
    return undefined;
  }
  return cookedWeightGrams / servings;
}
