import { Fmt } from '../Fmt';

const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const;

/**
 * A small count as a word, the way a coach says it (MM-617's grammar):
 * "two cups", "three sessions". Whole numbers from 0 to 10; anything else
 * rounded and in digits, grouped ("12", "1,054").
 */
export function countWord(count: number): string {
  const word = Number.isInteger(count) && count >= 0 ? words[count] : undefined;
  return word ?? Fmt.whole(count);
}
