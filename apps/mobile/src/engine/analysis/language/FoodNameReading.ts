import type { FoodMatch } from './FoodMatch';
import type { FoodTag } from './FoodTag';
import type { FoodToken } from './FoodToken';

/** How the tagger read one food's name (MM-617): its words, the phrases it found, and the tags they settled to. */
export interface FoodNameReading {
  readonly tokens: readonly FoodToken[];
  readonly matches: readonly FoodMatch[];
  readonly tags: ReadonlySet<FoodTag>;
}
