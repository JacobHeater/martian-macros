/**
 * A food's values per 100 g, as a source states them. Anything a source left
 * out is undefined.
 */
export interface NutritionPer100g {
  readonly name: string;
  readonly kcal?: number | undefined;
  readonly proteinG?: number | undefined;
  readonly carbsG?: number | undefined;
  readonly fatG?: number | undefined;
  readonly fiberG?: number | undefined;
  readonly alcoholG?: number | undefined;
}
