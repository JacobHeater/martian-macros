/**
 * What the body-fat estimate rests on (MM-34): the figure the user gave,
 * the formula from height, weight, age and sex alone, that formula joined
 * by the user's waist entries, or either joined by a smart scale's readings
 * (MM-502).
 */
const values = ['yourFigure', 'formula', 'waist', 'scale'] as const;

export type BodyFatBasis = (typeof values)[number];

export const BodyFatBasis = { values } as const;
