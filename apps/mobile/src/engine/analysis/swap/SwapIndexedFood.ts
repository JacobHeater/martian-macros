import type { FoodTag } from '../language/FoodTag';
import type { TradeCatalogFood } from '../TradeCatalogFood';

/** A catalog food in a group's name index (MM-617): the food at its default serving, with its name read ahead. */
export interface SwapIndexedFood {
  readonly food: TradeCatalogFood;
  /** Its name's tags (`foodTagsOf`): how it was made and what kind of food it is. */
  readonly tags: ReadonlySet<FoodTag>;
  /** Its name's words that weigh (`nameTermsOf`). */
  readonly terms: readonly string[];
  /** Each term's TF-IDF weight over the group, the vector of unit length; empty for a name with no term. */
  readonly weights: ReadonlyMap<string, number>;
}
