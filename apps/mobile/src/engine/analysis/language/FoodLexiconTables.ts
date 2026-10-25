import type { FoodPhrases } from './FoodPhrases';
import type { FoodTagRule } from './FoodTagRule';

/**
 * The reviewed data the food-language tagger reads (MM-617): how a name's
 * words are normalized, what the words and phrases mean, and the rules
 * that settle them. `foodLexicon` is the one instance.
 */
export interface FoodLexiconTables {
  /** Families of words and phrases; a key appears in one family only. */
  readonly phrases: readonly FoodPhrases[];
  /** Brand and packaging noise ("inc", "oz", "pack"): never a phrase alone, but a phrase may include one ("juice pack"). */
  readonly stopWords: readonly string[];
  /** Words that end in "s" and are not plurals ("hummus", "asparagus", "gas"). */
  readonly keepPlural: readonly string[];
  /** Singulars in "ie" whose plural ends in "ies" ("cookie", "brownie"); every other "ies" folds to "y". */
  readonly ieSingulars: readonly string[];
  /** Plurals no rule folds ("leaves" → "leaf"). */
  readonly irregularPlurals: Readonly<Record<string, string>>;
  /** Spellings read as another ("doughnut" → "donut", "barbecue" → "bbq", "n" → "and"). */
  readonly aliases: Readonly<Record<string, string>>;
  readonly rules: readonly FoodTagRule[];
}
