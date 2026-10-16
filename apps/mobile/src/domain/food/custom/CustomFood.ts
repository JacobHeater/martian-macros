import { Micronutrients } from '../micros/Micronutrients';
import type { NutritionTotals } from '../portion/NutritionTotals';
import type { CustomFoodKind } from './CustomFoodKind';
import type { RecipeIngredient } from './RecipeIngredient';

interface CustomFoodInit {
  id: number;
  name: string;
  kind: CustomFoodKind;
  servingDescription: string;
  perServing: NutritionTotals;
  servingGrams?: number | undefined;
  barcode?: string | undefined;
  servings?: number | undefined;
  cookedWeightGrams?: number | undefined;
  ingredients?: readonly RecipeIngredient[];
  fiberG?: number | undefined;
  micros?: Micronutrients;
}

/**
 * A food or recipe the user defined once to log in any amount (MM-45).
 *
 * Numbers are per serving. A recipe's per-serving numbers are calculated from
 * its `ingredients` and `servings`, and its serving weighs
 * `cookedWeightGrams` divided by `servings` when the cooked weight is known.
 * Editing one never changes entries already logged from it.
 */
export class CustomFood {
  /** Database id; 0 for one not yet saved. */
  readonly id: number;
  readonly name: string;
  readonly kind: CustomFoodKind;

  /** "1 bar", "1 serving". */
  readonly servingDescription: string;

  /**
   * What one serving weighs; undefined when it is not known (a recipe
   * without a cooked weight), in which case it is logged by servings only.
   */
  readonly servingGrams: number | undefined;
  readonly perServing: NutritionTotals;

  /** GTIN-14, so scanning the product finds it (MM-43). */
  readonly barcode: string | undefined;

  /** How many servings a recipe makes. */
  readonly servings: number | undefined;
  readonly cookedWeightGrams: number | undefined;
  readonly ingredients: readonly RecipeIngredient[];

  /** Fiber per serving, when the label or the user stated it (MM-309). */
  readonly fiberG: number | undefined;

  /** Sodium and the micronutrients per serving, when stated (MM-309); a recipe has none. */
  readonly micros: Micronutrients;

  constructor(init: CustomFoodInit) {
    this.id = init.id;
    this.name = init.name;
    this.kind = init.kind;
    this.servingDescription = init.servingDescription;
    this.perServing = init.perServing;
    this.servingGrams = init.servingGrams;
    this.barcode = init.barcode;
    this.servings = init.servings;
    this.cookedWeightGrams = init.cookedWeightGrams;
    this.ingredients = init.ingredients ?? [];
    this.fiberG = init.fiberG;
    this.micros = init.micros ?? Micronutrients.none;
  }
}
