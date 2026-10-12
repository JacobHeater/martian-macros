import type { RecompMeasure, RecompSignal } from '../engine';
import { StateError } from '../lang/StateError';
import type { Fmt } from './Fmt';
import { waistAmount } from './waistAmount';

const missing: Readonly<Record<RecompMeasure, string>> = {
  waist:
    'Your trend weight is holding and your lifts are going up. Measure ' +
    'your waist once a week to see whether it is coming down too.',
  strength:
    'Your trend weight is holding and your waist is down. Log your ' +
    'training to see whether your lifts are going up too.',
  weight:
    'Your waist is down and your lifts are going up. Weigh in on most ' +
    'mornings to see whether your weight is holding.',
};

/**
 * What the recomp signal card says (MM-32), or undefined when there is
 * nothing to say. With the signal present: the three things seen, and what
 * they do and do not show. With one measure not logged: what logging it
 * would add.
 *
 * It names a pattern. It never says fat was lost or muscle gained: a tape,
 * a scale and a training log cannot measure either.
 */
export function recompSignalText(signal: RecompSignal, fmt: Fmt): string | undefined {
  if (signal.present) {
    const { trendWeightKg, waistChangeCm } = signal;
    if (trendWeightKg === undefined || waistChangeCm === undefined) {
      throw new StateError('A recomp signal that is present has a trend weight and a waist change.');
    }
    const lifts = signal.liftsUp.map((name) => name.toLowerCase());
    const named =
      lifts.length <= 2 ? lifts.join(' and ') : `${lifts.slice(0, 2).join(', ')} and ${lifts.length - 2} more`;
    return (
      `Trend weight held near ${fmt.weight(trendWeightKg)}. ` +
      `Waist down about ${waistAmount(waistChangeCm, fmt)}. ` +
      `Estimated maxes are up on ${named}. ` +
      'This pattern is consistent with losing fat while keeping or gaining ' +
      'muscle. It does not measure either.'
    );
  }
  const only = signal.onlyMissing;
  return only === undefined ? undefined : missing[only];
}
