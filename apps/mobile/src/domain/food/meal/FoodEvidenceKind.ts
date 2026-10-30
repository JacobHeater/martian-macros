const values = [
  /** The assistant's numbers, which it marked verified and cited a specific source for. */
  'cited',
  /** Found in the app's own food packs by the item's plain name, scaled to its grams. */
  'matched',
  /** The assistant's own estimate: unverified, or nothing cited, and nothing matched. */
  'estimated',
  /** Changed or added by the person. */
  'yours',
  /** Read from the product's Nutrition Facts panel on the phone (MM-44); only a saved food carries it (MM-710). */
  'label',
] as const;

/** Where an item of an analysed meal (MM-586) or a saved food (MM-710) got its numbers. */
export type FoodEvidenceKind = (typeof values)[number];

export const FoodEvidenceKind = { values } as const;
