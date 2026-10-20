const values = ['raw', 'cooked', 'packaged'] as const;

/**
 * The state a food was in when it was logged (MM-151, MM-167): weighed raw
 * or dry, weighed cooked, or as a packaged product's label states it. An
 * entry whose food states none has none; nothing is invented.
 */
export type Preparation = (typeof values)[number];

export const Preparation = { values } as const;
