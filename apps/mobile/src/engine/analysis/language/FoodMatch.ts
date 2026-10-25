import type { FoodSense } from './FoodSense';

/** A lexicon phrase found in a food's name (MM-617): where, which, and what it means. */
export interface FoodMatch {
  /** The index of its first token. */
  readonly start: number;
  /** How many tokens it covers. */
  readonly length: number;
  readonly phrase: string;
  readonly senses: readonly FoodSense[];
  /** A "flavored" later in its part of the name made it a flavor: only its qualifying cues count. */
  readonly flavor: boolean;
  /** A "without" or "for" before it in its part of the name, or a "no" right before it: none of its senses count. */
  readonly negated: boolean;
}
