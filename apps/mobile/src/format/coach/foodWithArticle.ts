import { foodInSentence } from './foodInSentence';
import { foodNameIsPlural } from './foodNameIsPlural';

/**
 * A food named mid-sentence with its article (MM-684): "a whole wheat
 * bagel", "an English muffin", "fries" (a plural takes none). The swap
 * table's words are already phrased and come back as they are.
 */
export function foodWithArticle(name: string, phrased = false): string {
  const text = foodInSentence(name);
  if (phrased || foodNameIsPlural(name)) return text;
  return `${/^[aeiou]/i.test(text) ? 'an' : 'a'} ${text}`;
}
