import type { CatalogFood } from './CatalogFood';

/** A search result and how well it matched (lower is better). */
export interface SearchHit {
  readonly food: CatalogFood;
  readonly score: number;
}
