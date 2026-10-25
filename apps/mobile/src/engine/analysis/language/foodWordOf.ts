import type { FoodLexiconIndex } from './FoodLexiconIndex';

/** Whether `word` may be a plural: four letters or more, ending in a lone "s", and not a word that only looks plural. */
function foldable(word: string, lexicon: FoodLexiconIndex): boolean {
  return word.length > 3 && word.endsWith('s') && !/(?:ss|us|is)$/.test(word) && !lexicon.keepPlural.has(word);
}

/** The singulars `word` may be the plural of, most specific first. */
function singularsOf(word: string): string[] {
  const forms: string[] = [];
  if (word.endsWith('ies')) forms.push(`${word.slice(0, -3)}y`, `${word.slice(0, -3)}ie`);
  if (word.endsWith('es')) forms.push(word.slice(0, -2));
  forms.push(word.slice(0, -1));
  return forms;
}

/** The singular of `word` by rule alone, for a word the lexicon does not know. */
function ruleSingularOf(word: string, lexicon: FoodLexiconIndex): string {
  if (word.endsWith('ies')) {
    const stem = word.slice(0, -3);
    return lexicon.ieSingulars.has(`${stem}ie`) ? `${stem}ie` : `${stem}y`;
  }
  if (/(?:ch|sh|x|z|o)es$/.test(word)) return word.slice(0, -2);
  return word.slice(0, -1);
}

/**
 * One word of a food's name, normalized (MM-617): the possessive dropped
 * ("tso's" → "tso") unless the lexicon knows the possessive itself
 * ("chili's", the restaurant), apostrophes removed, a plural folded to its
 * singular ("wings" → "wing", "fries" → "fry", "berries" → "berry") unless
 * the word only looks plural ("hummus", "asparagus", "gas"), and an alias
 * read as its main spelling ("doughnut" → "donut"). Where a word could fold
 * more than one way ("cookies", "quiches"), the form the lexicon knows
 * wins; `raw` is already lower case and unaccented.
 */
export function foodWordOf(raw: string, lexicon: FoodLexiconIndex): string {
  const known = (word: string) => lexicon.vocabulary.has(word);
  const main = (word: string) => lexicon.aliases.get(word) ?? word;
  if (known(raw)) return main(raw);
  const word = raw.replace(/'s$/, '').replace(/'/g, '');
  if (known(word)) return main(word);
  const irregular = lexicon.irregularPlurals.get(word);
  if (irregular !== undefined) return main(irregular);
  if (!foldable(word, lexicon)) return main(word);
  const singular = singularsOf(word).find(known);
  return main(singular ?? ruleSingularOf(word, lexicon));
}
