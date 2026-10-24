const values = ['fix', 'holdingUp', 'dataQuality', 'left'] as const;

/**
 * Where a finding goes in "What your data says" (MM-610): worth changing,
 * holding up, a data-quality limit on the rest, or what is left today (MM-612).
 */
export type CoachFindingKind = (typeof values)[number];

export const CoachFindingKind = { values } as const;
