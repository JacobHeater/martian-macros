const values = ['all', 'most', 'half', 'little'] as const;

/** How much of what the photos show was eaten, as the person says before it is sent (MM-599). */
export type MealPortionEaten = (typeof values)[number];

export const MealPortionEaten = {
  values: values as readonly MealPortionEaten[],
} as const;
