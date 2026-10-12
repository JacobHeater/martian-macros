import type { DayWeighIn } from '../healthIngest';
import { clockTimeText } from './clockTimeText';

/**
 * Where an imported weigh-in came from and why it is the one that counts
 * (MM-71): "From Bathroom scale at 6:42 AM." or "The middle of 3 readings
 * from Bathroom scale."
 */
export function importedWeighInText(weighIn: DayWeighIn): string {
  const at = weighIn.at;
  if (weighIn.basis === 'firstMorning' && at !== undefined) {
    return `From ${weighIn.sourceName} at ${clockTimeText(at)}.`;
  }
  return weighIn.readings === 1
    ? `From ${weighIn.sourceName}.`
    : `The middle of ${weighIn.readings} readings from ${weighIn.sourceName}.`;
}
