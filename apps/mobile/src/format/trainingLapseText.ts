import type { TrainingLapse } from '../engine/TrainingLapse';
import { TrainingRule } from '../engine/TrainingRule';

/**
 * What the coach says when training has lapsed against a goal that needs
 * it (MM-134). Never implies laziness (MM-108): it says what lifting does.
 */
export function trainingLapseText(lapse: TrainingLapse): { title: string; text: string } | undefined {
  if (lapse.kind === 'none') return undefined;
  const since = lapse.daysSince === undefined ? 'No workout has been logged' : `No workout has been logged for ${lapse.daysSince} days`;
  if (lapse.kind === 'suspend') {
    return {
      title: 'The surplus is paused',
      text:
        (lapse.noTrainingDays ? 'Training days are set to none' : since) +
        '. A surplus without training is stored as fat, so targets sit at maintenance. Lean-gain targets return at the check-in after a workout is logged' +
        (lapse.noTrainingDays ? ', with training days set again' : '') +
        '.',
    };
  }
  if (lapse.goal === 'leanGain') {
    return {
      title: 'Training is what the gain is for',
      text: `${since}. On a gain, the surplus pauses at ${TrainingRule.suspendAfterDays} days without one, until you log a workout.`,
    };
  }
  return {
    title: 'Lifting keeps the muscle',
    text: `${since}. Lifting is what tells your body to keep muscle while you lose weight. Nothing about your targets changes.`,
  };
}
