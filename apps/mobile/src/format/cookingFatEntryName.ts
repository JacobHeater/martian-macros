import type { CookingFatKind } from '../domain';

const names: Readonly<Record<CookingFatKind, string>> = {
  oil: 'Cooking oil',
  butter: 'Butter',
  ghee: 'Ghee',
  coconutOil: 'Coconut oil',
};

/** What the entry for the fat a food was cooked in is called (MM-152). */
export const cookingFatEntryName = (kind: CookingFatKind): string => names[kind];
