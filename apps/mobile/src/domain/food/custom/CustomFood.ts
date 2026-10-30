import type { FoodGroup } from '../FoodGroup';
import type { FoodEvidence } from '../meal/FoodEvidence';
import { Micronutrients } from '../micros/Micronutrients';
import type { NutritionTotals } from '../portion/NutritionTotals';
import type { CustomFoodKind } from './CustomFoodKind';
import type { FoodIngredient } from './FoodIngredient';
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
  sugarAlcoholsG?: number | undefined;
  micros?: Micronutrients;
  group?: FoodGroup | undefined;
  evidence?: FoodEvidence | undefined;
  madeOf?: readonly FoodIngredient[];
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

  /** Sugar alcohols per serving, when stated (MM-397). */
  readonly sugarAlcoholsG: number | undefined;

  /** Sodium and the micronutrients per serving, when stated (MM-309); a recipe has none. */
  readonly micros: Micronutrients;

  /** What kind of food it is (MM-616, MM-710), so the coach can trade it within its group; none unless set. */
  readonly group: FoodGroup | undefined;

  /**
   * Where its numbers came from (MM-710): read from a label, cited or
   * matched by the person's assistant, its unverified estimate, or the
   * person's own. None for a food saved before this was kept.
   */
  readonly evidence: FoodEvidence | undefined;

  /** What went into a homemade food (MM-708), as a note; empty for any other food. */
  readonly madeOf: readonly FoodIngredient[];

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
    this.sugarAlcoholsG = init.sugarAlcoholsG;
    this.micros = init.micros ?? Micronutrients.none;
    this.group = init.group;
    this.evidence = init.evidence;
    this.madeOf = init.madeOf ?? [];
  }
}
