const values = ['per100g', 'per100ml', 'perServing'] as const;

/** The amount that a food's reference nutrition is stated for. */
export type ReferenceBasis = (typeof values)[number];

export const ReferenceBasis = { values } as const;
