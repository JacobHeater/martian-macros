const values = ['fried', 'sweetAndFatty'] as const;

/**
 * Why a food's grade is held to C- whatever its score (MM-660, the owner):
 * `fried`, by the words of its name (fried, battered, breaded, a doughnut,
 * fries, chips); `sweetAndFatty`, by its numbers (fat and sugar with little
 * that counts for it). A nutrient table cannot see a fryer, so the cap reads
 * the source's own words and the one signature that has no words, a sauced
 * or sweet dish that is mostly fat and sugar.
 */
export type GradeCap = (typeof values)[number];

export const GradeCap = { values } as const;
