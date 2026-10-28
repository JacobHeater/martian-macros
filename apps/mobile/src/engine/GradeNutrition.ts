import type { GradeMicronutrient } from './GradeMicronutrient';

/**
 * What the food grade reads of a food, per 100 g (MM-380). Undefined, or a
 * micronutrient left out, means not stated, never zero (MM-310).
 */
export interface GradeNutrition {
  readonly kcal: number;
  readonly proteinG: number;
  /** Total fat, for the share of calories it carries (MM-660's cap); absent, the numbers cannot cap the food. */
  readonly fatG?: number | undefined;
  /** Total carbohydrate; fiber is part of it, so it bounds a fiber that is not stated (MM-567). */
  readonly carbsG: number | undefined;
  readonly fiberG: number | undefined;
  readonly sodiumMg: number | undefined;
  readonly sugarsG: number | undefined;
  readonly saturatedFatG: number | undefined;
  readonly alcoholG: number | undefined;
  /** The vitamins and minerals the grade counts, each in its own unit. */
  readonly micros: Readonly<Partial<Record<GradeMicronutrient, number>>>;
}
