import { readableFoodName } from './readableFoodName';

/**
 * Words that keep their capital mid-sentence: places, peoples and names a
 * food is called after ("Chinese buffet", "Greek yogurt", "English
 * muffin", "General Tso's chicken").
 */
const proper = new Set([
  'american',
  'asian',
  'buffalo',
  'cajun',
  'caesar',
  'cantonese',
  'chinese',
  'cuban',
  'english',
  'french',
  'general',
  'german',
  'greek',
  'hawaiian',
  'indian',
  'irish',
  'italian',
  'jamaican',
  'japanese',
  'korean',
  'mediterranean',
  'mexican',
  'mongolian',
  'philly',
  'spanish',
  'swiss',
  'szechuan',
  'tex-mex',
  'thai',
  'turkish',
  'vietnamese',
]);

/**
 * A food's name in the middle of a sentence (MM-617's grammar): readable
 * (`readableFoodName`), with its first letter in lower case unless the
 * name opens with a proper word ("Chinese buffet", "General Tso's"), a
 * word in capitals or mixed case ("BBQ", "McDonald's"), or a second word
 * with a capital ("Diet Pepsi"). "Sausage egg and cheese biscuit" is "the
 * sausage egg and cheese biscuit"; "Cookie butter" is "cookie butter". A
 * sentence that opens with it is capitalized again (`sentenceCase`).
 */
export function foodInSentence(name: string): string {
  const text = readableFoodName(name);
  const [first = '', second = ''] = text.split(' ');
  const keep =
    proper.has(first.toLowerCase().replace(/['’]s$/, '')) ||
    /[A-Z]/.test(first.slice(1)) ||
    /^[A-Z]/.test(second);
  return keep ? text : `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}
