const values = ['left', 'right'] as const;

/** The side limbs are measured on, chosen once so every entry is of the same limb (MM-156). */
export type LimbSide = (typeof values)[number];

export const LimbSide = { values } as const;
