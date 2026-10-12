const values = [
  /** Calories and protein. */
  'simple',
  /** Calories, protein, carbohydrate and fat. */
  'standard',
  /** Adds fiber, net carbohydrate, sodium and alcohol where known. */
  'full',
] as const;

/**
 * How much nutrition to show (MM-49). It changes what is displayed, never
 * what is stored.
 */
export type DetailLevel = (typeof values)[number];

export const DetailLevel = {
  values,

  showsCarbsAndFat(level: DetailLevel): boolean {
    return level !== 'simple';
  },

  showsExtras(level: DetailLevel): boolean {
    return level === 'full';
  },
} as const;
