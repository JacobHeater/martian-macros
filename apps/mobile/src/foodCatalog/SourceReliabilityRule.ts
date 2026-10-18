import type { TrustTier } from './TrustTier';

/**
 * The figures of the app's own reliability score for a food's numbers
 * (MM-383): a base for where they came from, then what the record itself
 * tells. Each is a judgement with a row in the evidence register. The score
 * orders search results and chooses between a barcode's records across
 * packs; it is never shown as a number (MM-153).
 */
export const SourceReliabilityRule = {
  /** By source: laboratory analyses first, then compiled, then labels, then crowd transcription. */
  bases: {
    usda_foundation: 95,
    usda_sr_legacy: 90,
    usda_fndds: 80,
    usda_branded: 65,
    off: 40,
  } as Readonly<Record<string, number>>,
  /** A source the rule does not know, by the tier the pack gave it. */
  basesByTier: { reference: 85, label: 60, checkThis: 35 } as Readonly<Record<TrustTier, number>>,
  /** A record marked "check this" because another source's record for the same barcode disagreed by more than 10%. */
  disagreementPenalty: 15,
  /** A record that states both fiber and sodium. */
  fiberAndSodiumBonus: 3,
  /** A record that states both sugars and saturated fat. */
  sugarsAndSaturatedFatBonus: 2,
} as const;
