import type { FoodTag } from '../language/FoodTag';

/**
 * One way a row of the coach's swap table matches a food's name (MM-617).
 * Every part given must hold: a phrase of `words`, a phrase of `andWords`,
 * and every tag in `tags` (`foodTagsOf`). Phrases are whole words, read as
 * `swapWordsOf` reads the name, so "cola" never matches "chocolate".
 */
export interface CoachSwapMatch {
  readonly words?: readonly string[] | undefined;
  readonly andWords?: readonly string[] | undefined;
  readonly tags?: readonly FoodTag[] | undefined;
}
