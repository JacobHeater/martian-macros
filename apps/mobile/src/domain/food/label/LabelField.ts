const values = ['servingGrams', 'kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'sodiumMg'] as const;

/** A number read from a Nutrition Facts panel that can be marked unsure (MM-44). */
export type LabelField = (typeof values)[number];

export const LabelField = { values } as const;
