import type { Micronutrients } from '../micros/Micronutrients';
import type { FoodEvidence } from './FoodEvidence';
import type { UsualPortion } from './UsualPortion';

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
  /** How much of it was eaten in this meal. */
  readonly grams?: number | undefined;
  /** A reasonable serving of it on its own, for logging it again (MM-595); required of an answer. */
  readonly usualPortion?: UsualPortion | undefined;
  readonly kcal?: number | undefined;
  readonly proteinG?: number | undefined;
  readonly carbsG?: number | undefined;
  readonly fatG?: number | undefined;
  readonly fiberG?: number | undefined;
  /** Sodium, total sugars and saturated fat among them, with any other micronutrient given. */
  readonly micros: Micronutrients;
  readonly evidence: FoodEvidence;
}
