import type { FoodSense } from './FoodSense';

/**
 * One step of the tagger after the words are read (MM-617). When the name
 * has any sense in `when`, and any in `also` (none listed: no condition),
 * and none in `unless`, the senses in `remove` go and those in `add` come.
 * Rules run in order, each once.
 */
export interface FoodTagRule {
  /** Why the rule exists, for the reviewer. */
  readonly why: string;
  readonly when: readonly FoodSense[];
  readonly also: readonly FoodSense[];
  readonly unless: readonly FoodSense[];
  readonly remove: readonly FoodSense[];
  readonly add: readonly FoodSense[];
}
