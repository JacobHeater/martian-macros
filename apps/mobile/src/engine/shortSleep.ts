import type { SleepAverage } from './SleepAverage';
import { SleepRule } from './SleepRule';

/**
 * Whether an average is short sleep (MM-252): under `SleepRule.shortSleepHours`
 * over at least `SleepRule.minimumNights` recorded nights. Fewer nights say
 * nothing, so a person who typed one short night is not told their sleep is short.
 */
export function shortSleep(average: SleepAverage | undefined): boolean {
  return (
    average !== undefined &&
    average.nights >= SleepRule.minimumNights &&
    average.averageMinutes < SleepRule.shortSleepHours * 60
  );
}
