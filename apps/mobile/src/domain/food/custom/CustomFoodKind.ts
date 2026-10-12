const values = ['food', 'recipe'] as const;

/**
 * Whether a saved food is one thing the user defined or a recipe made of
 * other foods (MM-45).
 */
export type CustomFoodKind = (typeof values)[number];

export const CustomFoodKind = { values } as const;
