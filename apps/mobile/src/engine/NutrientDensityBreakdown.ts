import type { GradeOmission } from '../domain/food/grade/GradeOmission';

/** The nutrient-density score and where it came from (MM-380). */
export interface NutrientDensityBreakdown {
  readonly score: number;
  readonly points: {
    readonly protein: number;
    readonly fiber: number;
    readonly micronutrients: number;
    readonly energyDensity: number;
    readonly sodium: number;
    readonly sugars: number;
    readonly saturatedFat: number;
  };
  /** The mean share of the Daily Values per 100 kcal over the stated nutrients, when counted. */
  readonly micronutrientsPercent: number | undefined;
  /** How many of the ten vitamins and minerals the food states. */
  readonly statedMicronutrients: number;
  /** The share of the sugars points kept after the waiver, 0 to 1, when sugars are stated. */
  readonly sugarsKept: number | undefined;
  /** What was not stated and so not counted. */
  readonly notCounted: readonly GradeOmission[];
}
