const values = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export type Meal = (typeof values)[number];

export const Meal = { values } as const;
