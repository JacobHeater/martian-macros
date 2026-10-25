import type { FoodSense } from './FoodSense';
import type { FoodTagRule } from './FoodTagRule';

/** `FoodLexiconTables` made ready to match (MM-617): one map of phrases, the words they use, and sets for normalizing. */
export interface FoodLexiconIndex {
  readonly phrases: ReadonlyMap<string, readonly FoodSense[]>;
  /** Every word of every phrase, and every alias: the forms a name's word is folded towards. */
  readonly vocabulary: ReadonlySet<string>;
  /** The most words in one phrase. */
  readonly longest: number;
  readonly stopWords: ReadonlySet<string>;
  readonly keepPlural: ReadonlySet<string>;
  readonly ieSingulars: ReadonlySet<string>;
  readonly irregularPlurals: ReadonlyMap<string, string>;
  readonly aliases: ReadonlyMap<string, string>;
  readonly rules: readonly FoodTagRule[];
}
