/**
 * A standard drink (MM-127): 14 g of alcohol, the US definition. A count of
 * drinks is only a way to type grams; the grams are what is stored, at
 * 7 kcal each, and never turned into carbohydrate or fat.
 */
export const StandardDrink = {
  grams: 14,

  /** The grams of alcohol in `drinks` standard drinks. */
  toGrams(drinks: number): number {
    return drinks * StandardDrink.grams;
  },
} as const;
