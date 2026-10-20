import { type StallAssessment, StallRule } from '../engine';
import { StateError } from '../lang/StateError';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { Fmt } from './Fmt';
import { shortSleepText } from './shortSleepText';

/**
 * What the coach says about a stall (MM-140): the body, then any options.
 *
 * Arithmetic, not accusation. It states averages and what they predict, and
 * offers options, never instructions. The chance that the log understates
 * what was eaten is raised once, only when the estimate is very low. Sleep
 * that averaged short comes first, before any line about the log (MM-252).
 */
export function stallText(a: StallAssessment, fmt: Fmt): readonly [body: string, options: readonly string[]] {
  const [body, options] = diagnosisText(a, fmt);
  const sleep = a.shortSleepAverageMinutes;
  if (sleep === undefined) return [body, options];
  return [`${shortSleepText({ averageMinutes: sleep, nights: a.shortSleepNights })} ${body}`, options];
}

/** The body and options of the diagnosis itself. */
function diagnosisText(a: StallAssessment, fmt: Fmt): readonly [body: string, options: readonly string[]] {
  switch (a.diagnosis) {
    case undefined:
      throw new StateError('Only a stall that was diagnosed has words.');
    case 'data':
      return [
        `The log is too thin to tell why. The last ${a.windowDays} days have ` +
          `${a.usableFoodDays} fully logged days and ${a.weighIns} ` +
          `weigh-ins. With ${StallRule.minimumFoodDays} logged days and ` +
          `${StallRule.minimumWeighIns} weigh-ins the coach can say what is ` +
          'happening.',
        [],
      ];
    case 'masked': {
      const waist = a.waistChangeCm;
      if (a.maskedByTraining && !a.maskedByEvent) {
        return [
          `You started training in the last ${StallRule.maskingEventDays} days. ` +
            'New training holds water in the muscles for a while, which can ' +
            'hide fat loss on the scale. The scale usually catches up. Nothing to change.',
          [],
        ];
      }
      if (!a.maskedByEvent && waist !== undefined) {
        const down = `${toStringAsFixed(fmt.lengthFromCm(Math.abs(waist)), 1)} ${fmt.lengthUnit}`;
        return [
          `Your waist is down ${down} while the scale held. That is usually fat ` +
            'loss hidden by water. Nothing to change.',
          [],
        ];
      }
      return [
        `Something you noted in the last ${StallRule.maskingEventDays} days ` +
          'can hold water on the scale for a while. The scale usually ' +
          'catches up. Nothing to change.',
        [],
      ];
    }
    case 'intake': {
      const intake = a.averageIntakeKcal;
      const target = a.averageTargetKcal;
      if (intake === undefined || target === undefined) {
        throw new StateError('A stall put down to intake has an average intake and target.');
      }
      return [
        `Your average has been about ${Fmt.whole(intake)} against a target ` +
          `of ${Fmt.whole(target)}. At ${Fmt.whole(intake)} the app would ` +
          'expect roughly the pace you are seeing.',
        a.gaining
          ? ['Keep the target', 'Move to a slower gain']
          : ['Keep the target', 'Move to a gentler pace that matches what you are eating'],
      ];
    }
    case 'estimate': {
      const change = a.expectedChangeKcal;
      const lead =
        'You have eaten at target and your weight has held. Your ' +
        `expenditure is ${a.gaining ? 'higher' : 'lower'} than estimated`;
      let body: string;
      if (a.atFloor) {
        body = `${lead}. Your target is already the lowest the app will suggest, so it will not come down.`;
      } else if (change === undefined) {
        body = `${lead}. The coach will account for it at the next check-in.`;
      } else {
        body =
          `${lead}; the target ${a.gaining ? 'goes up' : 'comes down'} by ` +
          `about ${Fmt.whole(Math.abs(change))} at the next check-in.`;
      }
      return [
        a.estimateLow
          ? `${body} An estimate this low often means some food is not making ` +
            'it into the log. Common places to look: oils, drinks, ' +
            'sauces, tastes while cooking.'
          : body,
        a.atFloor ? ['Take a break at maintenance for a week or two', 'Add some daily walking'] : [],
      ];
    }
  }
}
