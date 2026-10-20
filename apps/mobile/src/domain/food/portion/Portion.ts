import type { QuantitySource } from '../../QuantitySource';
import type { Conversion } from './Conversion';
import type { FoodOrigin } from './FoodOrigin';
import type { NutritionBasis } from './NutritionBasis';
import type { PortionUnit } from './PortionUnit';
import type { Preparation } from './Preparation';
import type { ReferenceNutrition } from './ReferenceNutrition';

/**
 * How much of a food was eaten and what the entry's numbers are for
 * (MM-167). It travels with an entry's totals so the portion can be read
 * back and the totals understood.
 *
 * An Estimate has no quantity or unit. A hand portion is a count only, with
 * no `reference` until the hand model exists (MM-46). Entries logged before
 * portions existed have no `Portion` at all, and nothing is invented for them.
 */
export interface Portion {
  readonly method: QuantitySource;
  readonly basis: NutritionBasis;

  /** Greater than zero when present; undefined only for an Estimate. */
  readonly quantity?: number | undefined;
  readonly unit?: PortionUnit | undefined;

  /**
   * The reference nutrition the totals were calculated from, for a
   * calculated entry.
   */
  readonly reference?: ReferenceNutrition | undefined;

  /** The food it was logged from, when it came from a pack or a saved food. */
  readonly origin?: FoodOrigin | undefined;

  /**
   * The state the food was in when it was logged (MM-151): raw or dry,
   * cooked, or as packaged. Undefined when the food states none.
   */
  readonly preparation?: Preparation | undefined;

  /**
   * How the unit became grams when the totals were calculated: a serving's
   * weight, a density or the hand model. None for a weight, or typed totals.
   */
  readonly conversion?: Conversion | undefined;

  /**
   * For a hand portion, the grams the hand model implied when it was logged
   * and the model's version (MM-46). Kept so the entry stays explicable if
   * the person's height is corrected or the model changes.
   */
  readonly impliedGrams?: number | undefined;
  readonly handModelVersion?: number | undefined;
}
