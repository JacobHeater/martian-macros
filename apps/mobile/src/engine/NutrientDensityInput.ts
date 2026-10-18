import type { GradeMicronutrient } from './GradeMicronutrient';

/** What the nutrient-density score reads, per 100 g, with the required values known (MM-380). */
export interface NutrientDensityInput {
  readonly kcal: number;
  readonly proteinG: number;
  readonly fiberG: number;
  readonly sodiumMg: number;
  readonly sugarsG: number | undefined;
  readonly saturatedFatG: number | undefined;
  readonly micros: Readonly<Partial<Record<GradeMicronutrient, number>>>;
}
