/**
 * What the food grade reads of a food, per 100 g (MM-369). Undefined means
 * not stated, never zero (MM-310).
 */
export interface GradeNutrition {
  readonly kcal: number;
  readonly proteinG: number;
  readonly sugarsG: number | undefined;
  readonly saturatedFatG: number | undefined;
  readonly sodiumMg: number | undefined;
  readonly fiberG: number | undefined;
  readonly alcoholG: number | undefined;
}
