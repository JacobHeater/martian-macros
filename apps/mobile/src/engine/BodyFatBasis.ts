/**
 * What the body-fat estimate rests on (MM-34): the figure the user gave,
 * the formula from height, weight, age and sex alone, or that formula
 * joined by the user's waist entries.
 */
const values = ['yourFigure', 'formula', 'waist'] as const;

export type BodyFatBasis = (typeof values)[number];

export const BodyFatBasis = { values } as const;
