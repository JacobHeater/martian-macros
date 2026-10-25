import { swapWordsOf } from './swapWordsOf';

/**
 * Words that say nothing about which food it is: joining words, amounts,
 * and how it was cooked. How it was cooked is the tags' to judge (a better
 * preparation, MM-617), so "Fried chicken thigh" is near "Chicken thigh,
 * roasted" by what it is.
 */
const ignored: ReadonlySet<string> = new Set(
  [
    // Joining words.
    'a', 'an', 'and', 'or', 'of', 'the', 'with', 'without', 'in', 'on', 'from', 'for', 'to', 'no', 'not', 'style', 'type',
    // Amounts and packaging.
    'cup', 'oz', 'ounce', 'g', 'gram', 'lb', 'serving', 'piece', 'pc', 'each', 'small', 'medium', 'large', 'nfs', 'ns',
    'prepared', 'ready', 'serve', 'commercial', 'restaurant', 'fast', 'food', 'home', 'recipe', 'frozen', 'canned',
    'added', 'salt', 'regular', 'plain',
    // How it was cooked.
    'fried', 'deep', 'pan', 'stir', 'air', 'breaded', 'battered', 'crispy', 'crunchy', 'grilled', 'roasted',
    'baked', 'broiled', 'steamed', 'boiled', 'poached', 'sauteed', 'braised', 'stewed', 'cooked', 'raw', 'heated',
    'microwaved', 'toasted', 'dry', 'heat', 'moist',
  ],
);

/**
 * The words of a food's name that weigh in the catalog's nearest name
 * (MM-617): `swapWordsOf`, without the words in `ignored` and without
 * numbers alone.
 */
export function nameTermsOf(name: string): readonly string[] {
  return swapWordsOf(name).filter((word) => !ignored.has(word) && !/^\d+$/.test(word));
}
