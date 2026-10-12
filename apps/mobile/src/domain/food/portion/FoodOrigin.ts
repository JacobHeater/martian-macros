/**
 * Which food an entry was logged from (MM-167), so the same food can be
 * found again, a raw or cooked choice remembered (MM-151), and a figure traced
 * back to where it came from. Compare two with `sameFoodOrigin`.
 */
export interface FoodOrigin {
  /** The food pack, or `custom` for a food the user saved. */
  readonly packId: string;

  /** The food's id within that pack. */
  readonly foodId: number;

  /** Where the pack got it (`usda_sr`, `off`, `user`, ...). */
  readonly source: string;

  /** The food's id in that source, where it has one. */
  readonly sourceId?: string | undefined;
}
