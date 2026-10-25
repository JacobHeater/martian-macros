import type { FoodLexiconIndex } from './FoodLexiconIndex';
import type { FoodToken } from './FoodToken';
import { foodWordOf } from './foodWordOf';

/**
 * The words of a food's name, normalized for matching (MM-617): lower
 * case; accents stripped ("jalapeño" → "jalapeno"); "&" read as "and";
 * split on anything that is not a letter, keeping an apostrophe inside a
 * word; each word folded by `foodWordOf`; stop words (brand and packaging
 * noise: "inc", "oz", "ct", "pack") marked, for a phrase may include them.
 * A lean percentage is read before the digits go: "93% lean" is lean, "70%
 * lean" is not.
 * Commas, semicolons, colons, slashes and brackets separate the name's
 * parts.
 */
export function foodTokensOf(name: string, lexicon: FoodLexiconIndex): readonly FoodToken[] {
  const text = name
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/&/g, ' and ')
    // "No. 126 gemelli" is a pasta's number, not "no".
    .replace(/\bno\.\s*\d+/g, ' ')
    // "93% lean ground beef" is lean; "70% lean meat / 30% fat" is not (USDA's lean is 10 g of fat per 100 g or less).
    .replace(/(\d{1,3})\s*%?\s*lean\b/g, (_, percent: string) => (Number(percent) >= 90 ? ' lean ' : ' regular '));
  const tokens: FoodToken[] = [];
  text.split(/[,;:()[\]{}/|]+/).forEach((piece, part) => {
    for (const match of piece.matchAll(/\p{L}+(?:'\p{L}+)*/gu)) {
      const raw = match[0];
      const word = foodWordOf(raw, lexicon);
      if (word === '') continue;
      tokens.push({ word, part, stop: lexicon.stopWords.has(word) || lexicon.stopWords.has(raw) });
    }
  });
  return tokens;
}
