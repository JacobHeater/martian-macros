import type { ReferenceBasis } from '../domain/food/portion/ReferenceBasis';

const values = ['per100g', 'per100ml'] as const;

/**
 * The amount a pack states a food's nutrition for (MM-650): 100 g, or 100 mL
 * for a liquid whose source states it so (a USDA Branded row served in mL, an
 * Open Food Facts product whose serving is a number of millilitres). A pack
 * older than format 5 is per 100 g throughout. The domain's `ReferenceBasis`
 * less "per serving", which a pack never is.
 */
export type CatalogBasis = Extract<ReferenceBasis, (typeof values)[number]>;

const codes: Readonly<Record<CatalogBasis, string>> = { per100g: 'g', per100ml: 'ml' };

export const CatalogBasis = {
  values,

  /** How the pack's `basis` column spells it. */
  code(basis: CatalogBasis): string {
    return codes[basis];
  },

  /** The basis a pack column names; per 100 g for anything else, never a misread one. */
  fromCode(code: string | undefined): CatalogBasis {
    return code === 'ml' ? 'per100ml' : 'per100g';
  },
} as const;
