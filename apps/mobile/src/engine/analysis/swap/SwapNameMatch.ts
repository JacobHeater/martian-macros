import type { SwapIndexedFood } from './SwapIndexedFood';

/** A catalog food near a name (MM-617), with how near: the cosine of their TF-IDF vectors, above 0 and at most 1. */
export interface SwapNameMatch {
  readonly food: SwapIndexedFood;
  readonly similarity: number;
}
