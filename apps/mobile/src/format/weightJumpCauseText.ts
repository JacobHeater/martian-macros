import type { WeightEventType } from '../domain/WeightEventType';
import type { WeightJumpCause } from '../engine/WeightJumpCause';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { Fmt } from './Fmt';

type Evidence = readonly (readonly [label: string, value: string])[];

/** "yesterday", "the day before", or "today" for a cause's `daysAgo`. */
function when(daysAgo: number): string {
  return daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : 'the day before';
}

/** The same, for the start of a label: "Yesterday", "The day before", "Today". */
function When(daysAgo: number): string {
  const words = when(daysAgo);
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const eventClauses: Readonly<Record<WeightEventType, string>> = {
  startedCreatine: 'starting creatine',
  stoppedCreatine: 'stopping creatine',
  illness: 'illness',
  travel: 'travel',
  newTraining: 'new or harder training',
  largeOrSaltyMeal: 'an unusually large or salty meal',
  other: 'the weight event',
};

const eventLabels: Readonly<Record<WeightEventType, string>> = {
  startedCreatine: 'Started creatine',
  stoppedCreatine: 'Stopped creatine',
  illness: 'Illness',
  travel: 'Travel',
  newTraining: 'New or harder training',
  largeOrSaltyMeal: 'Large or salty meal',
  other: 'Weight event',
};

/**
 * One likely cause of a jump on the scale (MM-142) as a clause of the
 * explanation's sentence ("carbohydrate yesterday, 340 g against your usual
 * 230 g") and as the figures behind it. Causes are likely, never certain:
 * the words never say a cause did it.
 */
export function weightJumpCauseText(cause: WeightJumpCause, fmt: Fmt): { clause: string; evidence: Evidence } {
  const n = (key: string) => cause.figures[key] ?? 0;
  const daysAgo = n('daysAgo');
  switch (cause.kind) {
    case 'weightEvent': {
      const type = cause.eventType ?? 'other';
      return {
        clause: `${eventClauses[type]} you noted ${when(daysAgo)}`,
        evidence: [['Weight event', `${eventLabels[type]} · ${when(daysAgo)}`]],
      };
    }
    case 'carbohydrate':
      return {
        clause: `carbohydrate ${when(daysAgo)}, ${Fmt.grams(n('amount'))} against your usual ${Fmt.grams(n('usual'))}`,
        evidence: [
          [`Carbohydrate ${when(daysAgo)}`, Fmt.grams(n('amount'))],
          ['Usual carbohydrate', `${Fmt.grams(n('usual'))} a day`],
        ],
      };
    case 'sodium':
      return {
        clause: `sodium ${when(daysAgo)}, ${Fmt.whole(n('amount'))} mg against your usual ${Fmt.whole(n('usual'))} mg`,
        evidence: [
          [`Sodium ${when(daysAgo)}`, `${Fmt.whole(n('amount'))} mg`],
          ['Usual sodium', `${Fmt.whole(n('usual'))} mg a day`],
        ],
      };
    case 'calories': {
      const over = n('overTargetKcal');
      return {
        clause: `calories yesterday, ${Fmt.kcal(n('kcal'))} against a ${Fmt.kcal(n('targetKcal'))} target`,
        evidence: [
          ['Calories yesterday', Fmt.kcal(n('kcal'))],
          ['Target', Fmt.kcal(n('targetKcal'))],
          [over < 0 ? 'Under target by' : 'Over target by', Fmt.kcal(Math.abs(over))],
          ['Expenditure estimate', Fmt.kcal(n('kcal') - n('overExpenditureKcal'))],
          ['Fat at most', fmt.weight(n('fatAtMostKg'))],
        ],
      };
    }
    case 'alcohol':
      return {
        clause: `alcohol ${when(daysAgo)}, ${Fmt.grams(n('alcoholG'))}`,
        evidence: [[`Alcohol ${when(daysAgo)}`, Fmt.grams(n('alcoholG'))]],
      };
    case 'workout':
      return { clause: `a workout ${when(daysAgo)}`, evidence: [['Workout', When(daysAgo)]] };
    case 'cycleWindow':
      return {
        clause: 'the days around a period start, when the body holds more water',
        evidence: [['Cycle', 'Inside the window around a period start']],
      };
    case 'phaseChange': {
      const days = roundHalfAwayFromZero(n('daysSince'));
      const since = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
      return {
        clause: `your targets changing ${since}, which moves stored carbohydrate and water for about ten days`,
        evidence: [['Targets changed', since.charAt(0).toUpperCase() + since.slice(1)]],
      };
    }
  }
}
