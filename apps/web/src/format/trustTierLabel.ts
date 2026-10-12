import type { TrustTier } from '../foodCatalog';

const labels: Readonly<Record<TrustTier, string>> = {
  reference: 'Reference',
  label: 'Label',
  checkThis: 'Check this',
};

/**
 * The one quiet mark a food carries (MM-153). It says what the numbers are,
 * not that anyone checked them: there is deliberately no "verified".
 */
export const trustTierLabel = (tier: TrustTier): string => labels[tier];
