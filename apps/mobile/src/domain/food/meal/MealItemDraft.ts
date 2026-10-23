import type { Micronutrients } from '../micros/Micronutrients';
import type { FoodEvidence } from './FoodEvidence';

/**
 * One food of an analysed meal before it is logged (MM-586): as the
 * assistant wrote it, matched in the food packs, or changed by the person.
 * A number not given is undefined, and the item is not ready until every
 * one it needs is there.
 */
export interface MealItemDraft {
  readonly name: string;
  /** Two to four plain words to look the food up by in the packs ("chicken breast roasted"). */
  readonly lookup?: string | undefined;
  readonly grams?: number | undefined;
  readonly kcal?: number | undefined;
  readonly proteinG?: number | undefined;
  readonly carbsG?: number | undefined;
  readonly fatG?: number | undefined;
  readonly fiberG?: number | undefined;
  /** Sodium, total sugars and saturated fat among them, with any other micronutrient given. */
  readonly micros: Micronutrients;
  readonly evidence: FoodEvidence;
}
