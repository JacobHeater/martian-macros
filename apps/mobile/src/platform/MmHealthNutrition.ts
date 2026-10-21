/**
 * What was eaten as the plugin is handed it to write (MM-70): kilocalories,
 * grams and milligrams, times in milliseconds. A nutrient left out is not
 * known, and is not written as zero.
 */
export interface MmHealthNutrition {
  readonly id: string;
  readonly startMs: number;
  readonly endMs: number;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly name?: string;
  readonly meal?: string;
  readonly fiberG?: number;
  readonly sugarsG?: number;
  readonly saturatedFatG?: number;
  readonly sodiumMg?: number;
}
