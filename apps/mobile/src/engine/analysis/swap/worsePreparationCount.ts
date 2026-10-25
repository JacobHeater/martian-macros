import type { FoodTag } from '../language/FoodTag';
import { worsePreparations } from './worsePreparations';

/** How many of the worse ways of making a food a replacement carries (MM-617): fewer ranks first. */
export function worsePreparationCount(tags: ReadonlySet<FoodTag>): number {
  return worsePreparations.filter((tag) => tags.has(tag)).length;
}
