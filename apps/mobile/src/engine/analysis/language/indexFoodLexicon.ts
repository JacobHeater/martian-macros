import type { FoodLexiconIndex } from './FoodLexiconIndex';
import type { FoodLexiconTables } from './FoodLexiconTables';
import type { FoodSense } from './FoodSense';

/**
 * `lexicon` made ready to match (MM-617). A key in two families keeps the
 * first family's meaning; the lexicon test forbids it, so this only
 * decides what a mistake does.
 */
export function indexFoodLexicon(lexicon: FoodLexiconTables): FoodLexiconIndex {
  const phrases = new Map<string, readonly FoodSense[]>();
  const vocabulary = new Set<string>();
  let longest = 1;
  for (const family of lexicon.phrases) {
    for (const [key, senses] of Object.entries(family)) {
      if (phrases.has(key)) continue;
      phrases.set(key, senses);
      const words = key.split(/,? /);
      longest = Math.max(longest, words.length);
      for (const word of words) vocabulary.add(word);
    }
  }
  const aliases = new Map(Object.entries(lexicon.aliases));
  for (const [from, to] of aliases) {
    vocabulary.add(from);
    vocabulary.add(to);
  }
  for (const word of lexicon.keepPlural) vocabulary.add(word);
  return {
    phrases,
    vocabulary,
    longest,
    stopWords: new Set(lexicon.stopWords),
    keepPlural: new Set(lexicon.keepPlural),
    ieSingulars: new Set(lexicon.ieSingulars),
    irregularPlurals: new Map(Object.entries(lexicon.irregularPlurals)),
    aliases,
    rules: lexicon.rules,
  };
}
