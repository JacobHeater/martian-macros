import type { CatalogBasis } from '../foodCatalog/CatalogBasis';

/** "per 100 g", or "per 100 mL" for a food stated so (MM-650), as a row says what a food's calories are for. */
export const per100Label = (basis: CatalogBasis): string => (basis === 'per100ml' ? 'per 100 mL' : 'per 100 g');
