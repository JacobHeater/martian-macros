/** What a pack says about itself: where it came from and under what terms. */
export interface FoodPackHeader {
  /** Names the pack, so a food can say which pack it came from. */
  readonly packId: string;
  readonly formatVersion: number;

  /** An ISO date, `2026-10-09`. */
  readonly builtOn: string;
  readonly region: string;

  /** Each source and its version, e.g. `USDA FoodData Central 2026-04`. */
  readonly sources: readonly string[];
  readonly license: string;
  readonly attribution: string;
}
