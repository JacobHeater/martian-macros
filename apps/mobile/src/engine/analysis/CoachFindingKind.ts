const values = ['fix', 'holdingUp', 'dataQuality', 'left', 'close'] as const;

/**
 * Where a finding goes in "What your data says" (MM-610): worth changing,
 * holding up, a data-quality limit on the rest, what is left today
 * (MM-612), or 1d's closing line on a day over target (MM-617's back to
 * plan), said last.
 */
export type CoachFindingKind = (typeof values)[number];

export const CoachFindingKind = { values } as const;
