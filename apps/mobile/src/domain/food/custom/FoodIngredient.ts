/**
 * What went into a homemade food, as the person's assistant listed it and
 * the person corrected it (MM-710): a name and, when known, its grams. Kept
 * on the saved food as a note, never recomputed.
 */
export interface FoodIngredient {
  readonly name: string;
  readonly grams?: number | undefined;
}
