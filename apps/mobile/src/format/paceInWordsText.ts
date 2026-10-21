import type { PaceInWords } from '../engine/PaceInWords';

const words: Record<PaceInWords, string> = {
  onPace: 'On pace',
  slowerThanPlanned: 'Slower than planned',
  fasterThanPlanned: 'Faster than planned',
  steady: 'Steady',
};

/**
 * The pace in words, for a person who sees no weight figure (MM-118), worded
 * as approximate until the coach is sure, as the pace in weight is.
 */
export function paceInWordsText(pace: PaceInWords, { confident }: { confident: boolean }): string {
  return confident ? words[pace] : `So far, ${words[pace].toLowerCase()}`;
}
