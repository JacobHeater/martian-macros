import type { DetailLevel } from '../domain';

const descriptions: Readonly<Record<DetailLevel, string>> = {
  simple: 'Calories and protein.',
  standard: 'Calories, protein, carbohydrate and fat.',
  full: 'Adds fiber, net carbohydrate, sodium and alcohol where the food states them.',
};

/** What this level shows, in a sentence for Settings. */
export const detailLevelDescription = (level: DetailLevel): string => descriptions[level];
