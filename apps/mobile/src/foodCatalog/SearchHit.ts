import type { CatalogFood } from './CatalogFood';
import type { CatalogServing } from './CatalogServing';

/** A search result and how well it matched (lower is better). */
export interface SearchHit {
  readonly food: CatalogFood;
  readonly score: number;
  /** The food's first serving, when it has one, to say on its row (MM-627). */
  readonly firstServing?: CatalogServing | undefined;
  /**
   * Found by some of the words typed, not all (MM-627): offered only when no
   * food matches them all, and said as the closest.
   */
  readonly partial?: boolean | undefined;
}
