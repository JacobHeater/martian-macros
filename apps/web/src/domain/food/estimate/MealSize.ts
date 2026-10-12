const multipliers = {
  light: 0.6,
  regular: 1,
  large: 1.5,
  veryLarge: 2.2,
} as const;

/**
 * How big a meal was, for a rough estimate (MM-150). Sizes are shares of a
 * "regular" meal, which is a third of the user's maintenance expenditure.
 * The multipliers are judgement, set toward the top of the honest range
 * because large meals are systematically under-estimated.
 */
export type MealSize = keyof typeof multipliers;

export const MealSize = {
  values: Object.keys(multipliers) as readonly MealSize[],

  /** Times a regular meal. */
  multiplier(size: MealSize): number {
    return multipliers[size];
  },
} as const;
