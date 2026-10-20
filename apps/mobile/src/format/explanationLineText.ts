import type { ExplanationLine } from '../engine';
import { StateError } from '../lang/StateError';
import { Fmt } from './Fmt';

const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Fmt.whole(Math.abs(value))}`;

/**
 * The words for one contribution to a change in targets (MM-138). They name
 * the cause and its size, and never a day's eating: the engine estimates
 * expenditure, it does not react to intake.
 */
export function explanationLineText(line: ExplanationLine): string {
  const { kcal } = line;
  const size = signed(kcal);
  const stated = (value: number | undefined, what: string): number => {
    if (value === undefined) throw new StateError(`A ${line.reason} line states ${what}.`);
    return value;
  };
  switch (line.reason) {
    case 'firstTargets':
      return 'Your first targets, from your starting estimate of expenditure.';
    case 'expenditureEstimate':
      return (
        `Your expenditure is ${Fmt.kcal(stated(line.to, 'what it came to'))} a day, ` +
        `${kcal < 0 ? 'down' : 'up'} from ${Fmt.whole(stated(line.from, 'what it was'))} (${size}).`
      );
    case 'paceAndWeight':
      return `Your pace and body weight moved the target (${size}).`;
    case 'goalChange':
      return `You changed your goal (${size}).`;
    case 'appRuleUpdate':
      return `The target rules changed in an app update (${size}).`;
    case 'profileCorrection':
      return `You corrected your profile or health check (${size}).`;
    case 'healthRule':
      return `Your health check rules out your goal, so targets are at maintenance (${size}).`;
    case 'underweightRule':
      return (
        'Your weight is below the range where the app plans a calorie ' +
        `deficit, so targets are at maintenance (${size}).`
      );
    case 'bodyFatEstimate':
      return `Your body-fat estimate moved a safety limit (${size}).`;
    case 'dietBreak':
      return `A maintenance break after a long deficit (${size}).`;
    case 'stepLimit':
      return (
        `Weekly changes are limited, so ${Fmt.whole(Math.abs(kcal))} kcal of the ` +
        `${kcal > 0 ? 'decrease' : 'increase'} is held for next week.`
      );
    case 'holdAfterRaise':
      return `Held at last week’s level after a raise (${size}).`;
    case 'safetyRaise':
      return `You were losing faster than the app aims for at your body fat, so targets went up (${size}).`;
    case 'userHold':
      return `You kept last week’s targets for now (${size}).`;
    case 'calorieFloor':
      return (
        `Your calorie floor is ${Fmt.kcal(stated(line.to, 'the floor'))}; the target would otherwise ` +
        `be ${Fmt.kcal(stated(line.from, 'the target without it'))}.`
      );
    case 'noExplanationRecorded':
      return 'No explanation was recorded for these targets.';
    case 'requestedBreak':
      return `A break you chose to take (${size}).`;
    case 'paceChange':
      return `You chose a different pace (${size}).`;
    case 'trainingLapse':
      return `The surplus paused for want of training (${size}).`;
    case 'breakEnded':
      return `The break ended and the deficit resumed (${size}).`;
  }
}
