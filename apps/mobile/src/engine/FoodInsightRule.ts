/**
 * The figures of the food inline insights (MM-365). Each is a judgement
 * recorded in the evidence register: no guideline tests one food's
 * macronutrient share, and the portion check's premise is an entry error,
 * not a verdict on eating (the panel's NU-1 to NU-9).
 */
export const FoodInsightRule = {
  /** "Mostly fat": at least this share of the item's calories from fat… */
  mostlyFatShare: 0.55,
  /** …on an item of at least this many calories… */
  mostlyFatMinKcal: 150,
  /** …unless protein supplies at least this share, so eggs, cheese, tofu, fish and meat are left alone. */
  proteinDenseShare: 0.2,
  /** A composition line needs the macros to explain at least this share of the energy, so blank macros say nothing. */
  knownMacrosShare: 0.75,
  /** "Light on protein": under this share of calories from protein… */
  lightOnProteinShare: 0.1,
  /** …on an item of at least this many calories… */
  lightOnProteinMinKcal: 400,
  /** …unless alcohol supplies at least this share, so a drink gets no protein line. */
  alcoholShare: 0.5,
  /** "Portion check": at least this many of the food's usual serving… */
  largePortionRatio: 2,
  /** …and at least this many calories… */
  largePortionMinKcal: 300,
  /** …or this many servings, which is almost surely a typo, whatever the calories. */
  largePortionMaxServings: 10,
} as const;
