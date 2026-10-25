import type { SwapIndexedFood } from './SwapIndexedFood';

/**
 * A food group's catalog foods indexed by name (MM-617), built ahead of
 * time by `swapNameIndexOf` so the swap's catalog step is answered at once:
 * each food's tags and its name's TF-IDF vector, with the document
 * frequencies the vector of another name is weighed by.
 */
export interface SwapNameIndex {
  /** The foods indexed: the group's pool, the N of the weights. */
  readonly foods: readonly SwapIndexedFood[];
  /** In how many of the pool's names each term is. */
  readonly documentFrequency: ReadonlyMap<string, number>;
}
