/** Words whose singular ends in "ie", so "cookies" is "cookie", not "cooky". */
const endsInIe: ReadonlySet<string> = new Set([
  'brownie',
  'calorie',
  'cookie',
  'hoagie',
  'pie',
  'pierogie',
  'smoothie',
  'veggie',
]);

/** Words that end in "s" in the singular. */
const keepS: ReadonlySet<string> = new Set(['hummus', 'couscous', 'asparagus', 'citrus', 'molasses', 'swiss', 'bus']);

/**
 * A food word in the singular (MM-617), by a few English rules: the swap
 * table's keywords and the catalog's names are folded the same way, so
 * "nuggets" meets "nugget" and "fries" meets "fries". Words of three letters
 * or fewer are kept as they are.
 */
export function singularOf(word: string): string {
  if (word.length <= 3 || keepS.has(word) || word.endsWith('ss') || word.endsWith('us') || word.endsWith('is')) return word;
  if (word.endsWith('ies')) {
    const ie = word.slice(0, -1);
    return endsInIe.has(ie) ? ie : `${word.slice(0, -3)}y`;
  }
  if (word.endsWith('oes')) return word.slice(0, -2);
  if (/(?:ch|sh|x|z)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}
