import { sleepDurationText } from './sleepDurationText';

/**
 * What the coach says when sleep averaged short (MM-252): the average and
 * the nights it rests on, then the one sentence the evidence supports
 * (Nedeltcheva 2010, Tasali 2022; docs/evidence.md). No claim that sleep
 * fixes, resets or boosts anything.
 */
export function shortSleepText({ averageMinutes, nights }: { averageMinutes: number; nights: number }): string {
  return (
    `Your sleep averaged ${sleepDurationText(averageMinutes)} over the last ${nights} nights. ` +
    'With short sleep, more of what you lose appears to be lean tissue and hunger runs higher.'
  );
}
