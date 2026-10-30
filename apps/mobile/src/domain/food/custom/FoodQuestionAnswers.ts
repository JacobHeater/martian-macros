/**
 * What the person told the app about a food before the prompt was built
 * (MM-708): the questions the assistant would ask, answered here so it
 * answers at once. Nothing else about the person goes with them.
 */
export interface FoodQuestionAnswers {
  readonly name: string;
  readonly homemade: boolean;
  /** The brand or restaurant; ignored when homemade. */
  readonly from: string;
  /** What one serving is ("1 biscuit"); blank when the assistant is to propose one. */
  readonly serving: string;
  /** What that serving weighs, in grams; undefined when not known. */
  readonly servingGrams: number | undefined;
  /** A GTIN-14 scanned here, when the food has one. */
  readonly barcode: string | undefined;
  /** Anything else, in the person's words (MM-602). */
  readonly notes: string;
  readonly photosAttached: boolean;
}
