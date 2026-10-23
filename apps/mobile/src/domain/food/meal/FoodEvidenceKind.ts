const values = [
  /** The assistant's numbers, which it marked verified and cited a specific source for. */
  'cited',
  /** Found in the app's own food packs by the item's plain name, scaled to its grams. */
  'matched',
  /** The assistant's own estimate: unverified, or nothing cited, and nothing matched. */
  'estimated',
  /** Changed or added by the person. */
  'yours',
] as const;

/** Where an item of an analysed meal got its numbers (MM-586). */
export type FoodEvidenceKind = (typeof values)[number];

export const FoodEvidenceKind = { values } as const;
