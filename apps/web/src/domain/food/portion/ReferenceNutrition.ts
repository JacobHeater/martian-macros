import type { NutritionTotals } from './NutritionTotals';
import type { PortionUnit } from './PortionUnit';
import type { ReferenceBasis } from './ReferenceBasis';

/**
 * A food's nutrition for a stated reference amount, with what is known about
 * that amount (MM-167). It is the input to scaling, kept so an entry can say
 * how its totals were worked out.
 */
export interface ReferenceNutrition {
  readonly basis: ReferenceBasis;

  /** The nutrition of one reference amount (100 g, 100 mL or one serving). */
  readonly nutrition: NutritionTotals;

  /** "1 cup, chopped": for a per-serving reference, or a serving the food has. */
  readonly servingDescription?: string | undefined;
  readonly servingGrams?: number | undefined;
  readonly servingMilliliters?: number | undefined;

  /**
   * The unit the source counts this serving in (a cup, a tablespoon). Eating
   * that unit scales by the count itself, as the source states it, so a
   * source's "1 cup (240 mL)" halves exactly, whatever a cup is elsewhere.
   */
  readonly servingUnit?: PortionUnit | undefined;

  /** Grams per millilitre, when the food has one. Never guessed. */
  readonly densityGPerMl?: number | undefined;
}
