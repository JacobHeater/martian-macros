/**
 * What the body-fat estimate rests on (MM-34): the figure the user gave,
 * the formula from height, weight, age and sex alone, that formula joined
 * by the user's waist entries, those joined by the Navy tape method from
 * waist, neck and (for a female profile) hip (MM-501), or any of them
 * joined by a smart scale's readings (MM-502).
 */
const values = ['yourFigure', 'formula', 'waist', 'tape', 'scale'] as const;

export type BodyFatBasis = (typeof values)[number];

export const BodyFatBasis = { values } as const;
