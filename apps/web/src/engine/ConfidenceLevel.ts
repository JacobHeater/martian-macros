const values = ['learning', 'fair', 'good'] as const;

export type ConfidenceLevel = (typeof values)[number];

export const ConfidenceLevel = { values } as const;
