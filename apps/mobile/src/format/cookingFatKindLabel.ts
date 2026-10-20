import type { CookingFatKind } from '../domain';

const labels: Readonly<Record<CookingFatKind, string>> = {
  oil: 'Oil',
  butter: 'Butter',
  ghee: 'Ghee',
  coconutOil: 'Coconut oil',
};

/** A cooking fat as a choice reads (MM-152). */
export const cookingFatKindLabel = (kind: CookingFatKind): string => labels[kind];
