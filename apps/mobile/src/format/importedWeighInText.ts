import type { DayWeighIn } from '../healthIngest';
import { clockTimeText } from './clockTimeText';

/**
 * Where an imported weigh-in came from and why it is the one that counts
 * (MM-71): "From Bathroom scale at 6:42 AM." or "The middle of 3 readings
 * from Bathroom scale."
 */
export function importedWeighInText(weighIn: DayWeighIn): string {
  // A source the platform did not name is said as where it was read from (MM-395).
  const source = weighIn.sourceName === '' ? 'Health Connect' : weighIn.sourceName;
  const at = weighIn.at;
  if (weighIn.basis === 'firstMorning' && at !== undefined) {
    return `From ${source} at ${clockTimeText(at)}.`;
  }
  return weighIn.readings === 1
    ? `From ${source}.`
    : `The middle of ${weighIn.readings} readings from ${source}.`;
}
