import type { FoodEvidenceKind } from './FoodEvidenceKind';

/**
 * Where a food's numbers came from, for a food of an analysed meal
 * (MM-586): the kind, and the source as it was cited or matched. Kept with
 * the entry so the source can be shown wherever the food is.
 */
export interface FoodEvidence {
  readonly kind: FoodEvidenceKind;
  /** The citation, or the pack food matched; none for the person's own. */
  readonly citation?: string | undefined;
}
