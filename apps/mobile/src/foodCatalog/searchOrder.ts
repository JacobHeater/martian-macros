import type { SearchHit } from './SearchHit';
import { sourceReliability } from './sourceReliability';

const wordsOf = (text: string): string[] => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

/**
 * How closely `name` matches the words typed (MM-627), lower first:
 * 0 when it begins with them as whole words, 1 when its first word begins
 * as the first one typed and each word typed begins one of its words, 2 for
 * any other match (through the brand, say).
 */
function closeness(typed: readonly string[], name: readonly string[]): number {
  if (typed.length > 0 && typed.every((word, i) => name[i] === word)) return 0;
  const first = typed[0];
  if (first !== undefined && name[0]?.startsWith(first) === true && typed.every((word) => name.some((n) => n.startsWith(word)))) {
    return 1;
  }
  return 2;
}

/**
 * The words of `name` beyond those typed, counted in pairs (MM-627): one
 * extra word ("raw", "cooked") is near-identical, so "Banana" and
 * "Banana, raw" tie and the more reliable record leads.
 */
function extraPairs(typed: readonly string[], name: readonly string[]): number {
  const extra = name.filter((n) => !typed.some((word) => n.startsWith(word))).length;
  return Math.floor(extra / 2);
}

/**
 * The order search results list in for `query` (MM-627, the owner's D-3):
 * the most words typed matched first (a partial match has fewer), then the
 * closest name, then fewer words beyond those typed, then the more reliable
 * source (MM-383) among names as close, then the database's own text score
 * (lower is better). With no words typed (a group listed), reliability then
 * the stored order, as before.
 */
export function searchOrder(query: string): (a: SearchHit, b: SearchHit) => number {
  const typed = wordsOf(query);
  const keyOf = (hit: SearchHit) => {
    if (typed.length === 0) return [-sourceReliability(hit.food), hit.score];
    const name = wordsOf(hit.food.name);
    const all = [...name, ...wordsOf(hit.food.brand ?? '')];
    const missing = typed.filter((word) => !all.some((n) => n.startsWith(word))).length;
    return [missing, closeness(typed, name), extraPairs(typed, name), -sourceReliability(hit.food), hit.score];
  };
  return (a, b) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    for (let i = 0; i < ka.length; i++) {
      const by = (ka[i] as number) - (kb[i] as number);
      if (by !== 0) return by;
    }
    return 0;
  };
}
