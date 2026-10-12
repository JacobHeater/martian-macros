import type { PreparationState } from '../foodCatalog/PreparationState';

/** A generic food's preparation state and the food it pairs with (MM-151). */
export interface PreparationLink {
  readonly state: PreparationState;

  /** Index, in the list given to `preparationLinks`, of the paired food. */
  readonly pairIndex?: number | undefined;
}
