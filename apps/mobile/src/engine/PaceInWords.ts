const values = ['onPace', 'slowerThanPlanned', 'fasterThanPlanned', 'steady'] as const;

/** How the trend moves against the intended pace, in words, for a person who sees no weight figure (MM-118). */
export type PaceInWords = (typeof values)[number];

export const PaceInWords = { values } as const;
