import { foodTagsOf } from '../language/foodTagsOf';
import type { TradeCatalogFood } from '../TradeCatalogFood';
import { nameTermsOf } from './nameTermsOf';
import type { SwapIndexedFood } from './SwapIndexedFood';
import type { SwapNameIndex } from './SwapNameIndex';
import { termWeightsOf } from './termWeightsOf';

/**
 * A group's name index (MM-617) over `foods`, its pool: the document
 * frequency of each term across the pool's names, then each food's tags
 * and TF-IDF vector. Built once, when the catalog is read ahead
 * (`CatalogTradeCatalog.load`), never on a swap.
 */
export function swapNameIndexOf(foods: readonly TradeCatalogFood[]): SwapNameIndex {
  const terms = foods.map((food) => nameTermsOf(food.name));
  const documentFrequency = new Map<string, number>();
  for (const name of terms) {
    for (const term of new Set(name)) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  }
  const indexed: SwapIndexedFood[] = foods.map((food, at) => {
    const own = terms[at] ?? [];
    return { food, tags: foodTagsOf(food.name), terms: own, weights: termWeightsOf(own, documentFrequency, foods.length) };
  });
  return { foods: indexed, documentFrequency };
}
