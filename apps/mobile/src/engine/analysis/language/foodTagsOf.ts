import type { FoodTag } from './FoodTag';
import { readFoodName } from './readFoodName';

/**
 * The tags a food's name carries (MM-617). Deterministic: the same name
 * always gives the same tags. Built over the reviewed lexicon in
 * `foodLexicon`, with tokens normalized for case, accents and plurals, and
 * multi-word phrases matched first (`readFoodName`).
 */
export function foodTagsOf(name: string): ReadonlySet<FoodTag> {
  return readFoodName(name).tags;
}
