/**
 * A replacement's figures in the coach's swap table (MM-617): typical
 * values a serving, or, beside `CoachSwapReplacement.ofFood`, shares of the
 * food's own. `sodiumMg` is stated only where the replacement is known to be
 * salty, and is then checked against the food's.
 */
export interface CoachSwapFigures {
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly sodiumMg?: number | undefined;
}
