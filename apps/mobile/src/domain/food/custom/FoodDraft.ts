import type { FoodGroup } from '../FoodGroup';
import type { FoodEvidence } from '../meal/FoodEvidence';
import type { Micronutrients } from '../micros/Micronutrients';
import type { FoodIngredient } from './FoodIngredient';

/**
 * One food of an assistant's answer before it is saved (MM-708, MM-709):
 * as the assistant wrote it, matched in the food packs, or changed by the
 * person. Its numbers are per 100 g. A number not given is undefined, and
 * the food is not ready until every one it needs is there.
 */
export interface FoodDraft {
  readonly name: string;
  /** The brand or restaurant, or "Homemade"; none when not said. */
  readonly brand?: string | undefined;
  /** Two to four plain words to look the food up by in the packs. */
  readonly lookup?: string | undefined;
  /** The group as the assistant wrote it; undefined when left out, and a problem when not one of the app's. */
  readonly group?: string | undefined;
  readonly servingDescription?: string | undefined;
  readonly servingGrams?: number | undefined;
  /** A GTIN-14, when the food has a barcode; tied to the saved food (MM-45). */
  readonly barcode?: string | undefined;
  readonly kcal?: number | undefined;
  readonly proteinG?: number | undefined;
  readonly carbsG?: number | undefined;
  readonly fatG?: number | undefined;
  readonly fiberG?: number | undefined;
  readonly sugarAlcoholsG?: number | undefined;
  readonly alcoholG?: number | undefined;
  /** Every micronutrient the app tracks; all are required of an answer. */
  readonly micros: Micronutrients;
  /** What went into a homemade food; empty for any other. */
  readonly ingredients: readonly FoodIngredient[];
  readonly evidence: FoodEvidence;
  /** Whether it is to be saved: on until the person unticks it. */
  readonly keep: boolean;
  /** The id of a saved food with the same name to replace; none to keep both, or when there is no such food. */
  readonly replaces?: number | undefined;
}
