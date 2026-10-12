import { ParsedFoodName } from './ParsedFoodName';
import type { PreparationLink } from './PreparationLink';

/**
 * Methods in the order a cooked entry is preferred as a raw food's pair:
 * the plain way people cook it and then weigh it.
 */
const preferred = ['boiled', 'steamed', 'roasted', 'baked', 'grilled'] as const;

const lengthOf = (names: readonly string[], index: number) => (names[index] as string).length;

/** The index of the shortest name; the first of them when several are as short. */
function shortest(indexes: readonly number[], names: readonly string[]): number {
  return indexes.reduce((a, b) => (lengthOf(names, b) < lengthOf(names, a) ? b : a));
}

function preferredCooked(cooked: readonly number[], parsed: readonly ParsedFoodName[], names: readonly string[]): number {
  for (const method of preferred) {
    const hits = cooked.filter((i) => (parsed[i] as ParsedFoodName).methods.has(method));
    if (hits.length > 0) return shortest(hits, names);
  }
  return shortest(cooked, names);
}

/**
 * The preparation state of each name in `names`, and for foods the source
 * states both raw (or dry) and cooked, the link between them (MM-151).
 *
 * Names follow USDA's comma-separated style: "Rice, white, raw" and "Rice,
 * white, cooked". Two names pair when they are the same food once the state
 * and cooking words are set aside. A raw food points to its preferred
 * cooked entry and every cooked entry points to the raw one. Nothing is
 * computed or guessed: a food with only one state has no pair.
 */
export function preparationLinks(names: readonly string[]): PreparationLink[] {
  const parsed = names.map((n) => ParsedFoodName.of(n));
  const groups = new Map<string, number[]>();
  parsed.forEach((p, i) => {
    if (p.state === undefined) return;
    const members = groups.get(p.base);
    if (members === undefined) groups.set(p.base, [i]);
    else members.push(i);
  });
  const links: PreparationLink[] = parsed.map((p) => ({ state: p.state ?? 'unspecified' }));
  for (const members of groups.values()) {
    const raws = members.filter((i) => (parsed[i] as ParsedFoodName).state === 'raw');
    const cooked = members.filter((i) => (parsed[i] as ParsedFoodName).state === 'cooked');
    if (raws.length === 0 || cooked.length === 0) continue;
    const raw = shortest(raws, names);
    const cook = preferredCooked(cooked, parsed, names);
    for (const r of raws) links[r] = { state: 'raw', pairIndex: cook };
    for (const c of cooked) links[c] = { state: 'cooked', pairIndex: raw };
  }
  return links;
}
