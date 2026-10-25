import { singularOf } from './singularOf';

/**
 * The words of a food's name as the swap reads them (MM-617): lower case,
 * accents stripped ("jalapeño" is "jalapeno"), "&" read as "and", a
 * possessive dropped ("General Tso's" is "general tso"), split on anything
 * that is not a letter or a digit, each word in the singular. Deterministic:
 * the same name always gives the same words.
 */
export function swapWordsOf(name: string): readonly string[] {
  const text = name
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/&/g, ' and ')
    .replace(/'s\b/g, '')
    .replace(/'/g, '');
  const words: string[] = [];
  for (const match of text.matchAll(/[\p{L}\p{N}]+/gu)) words.push(singularOf(match[0]));
  return words;
}
