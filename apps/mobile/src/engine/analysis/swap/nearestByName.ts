import { compareStrings } from '../../../lang/compareStrings';
import { nameTermsOf } from './nameTermsOf';
import type { SwapNameIndex } from './SwapNameIndex';
import type { SwapNameMatch } from './SwapNameMatch';
import { termWeightsOf } from './termWeightsOf';

/**
 * The index's foods nearest to `name` (MM-617), nearest first: the cosine
 * of the name's TF-IDF vector, weighed by the pool's document frequencies,
 * and each food's. Only foods that share a weighed term (a similarity
 * above 0); ties by name, so the order is the same every time.
 */
export function nearestByName(index: SwapNameIndex, name: string): readonly SwapNameMatch[] {
  const query = termWeightsOf(nameTermsOf(name), index.documentFrequency, index.foods.length);
  if (query.size === 0) return [];
  const matches: SwapNameMatch[] = [];
  for (const food of index.foods) {
    let similarity = 0;
    for (const [term, weight] of query) similarity += weight * (food.weights.get(term) ?? 0);
    if (similarity > 0) matches.push({ food, similarity: Math.min(1, similarity) });
  }
  return matches.sort((a, b) => b.similarity - a.similarity || compareStrings(a.food.food.name, b.food.food.name));
}
