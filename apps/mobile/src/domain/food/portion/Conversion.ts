import type { ConversionKind } from './ConversionKind';

/**
 * The conversion that turned an entry's unit into grams (MM-167): its kind
 * and the grams one unit came to. Kept with the entry so the portion stays
 * explicable if the food's serving, density or the hand model changes. A
 * weight needs none, and a typed total has none.
 */
export interface Conversion {
  readonly kind: ConversionKind;

  /** Grams in one of the entry's unit, as used when it was logged. */
  readonly gramsPerUnit: number;
}
