import type { Micronutrient } from '../domain/food/micros/Micronutrient';

const values = ['potassium', 'calcium', 'iron', 'magnesium', 'zinc', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12', 'folate'] as const satisfies readonly Micronutrient[];

/**
 * The ten vitamins and minerals the food grade counts (MM-380): the
 * tracked micronutrients that have a reference amount to reach. Sodium
 * counts against a food separately; sugars, saturated fat and cholesterol
 * have no amount to reach.
 */
export type GradeMicronutrient = (typeof values)[number];

export const GradeMicronutrient = { values } as const;
