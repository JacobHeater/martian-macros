import type { GradeMicronutrient } from './GradeMicronutrient';

/**
 * What the food grade reads of a food, per 100 g (MM-380). Undefined, or a
 * micronutrient left out, means not stated, never zero (MM-310).
 */
export interface GradeNutrition {
  readonly kcal: number;
  readonly proteinG: number;
  readonly fiberG: number | undefined;
  readonly sodiumMg: number | undefined;
  readonly sugarsG: number | undefined;
  readonly saturatedFatG: number | undefined;
  readonly alcoholG: number | undefined;
  /** The vitamins and minerals the grade counts, each in its own unit. */
  readonly micros: Readonly<Partial<Record<GradeMicronutrient, number>>>;
}
