const values = ['bia', 'navyTape', 'skinfold', 'dexa'] as const;

export type BodyFatMethod = (typeof values)[number];

export const BodyFatMethod = { values } as const;
