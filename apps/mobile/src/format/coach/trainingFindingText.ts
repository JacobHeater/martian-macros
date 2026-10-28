import { MuscleGroup } from '../../domain/training/MuscleGroup';
import type { CoachFinding } from '../../engine/analysis/CoachFinding';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { StateError } from '../../lang/StateError';
import { toStringAsFixed } from '../../lang/toStringAsFixed';
import { Fmt } from '../Fmt';
import { minutesText } from '../minutesText';
import { muscleGroupLabel } from '../muscleGroupLabel';
import { sleepDurationText } from '../sleepDurationText';
import { waterAmount } from '../waterAmount';
import { weekdayLabel } from '../weekdayLabel';
import { coachAdviceText } from './coachAdviceText';
import { coachPhrase } from './coachPhrase';
import { coachPhraseKey } from './coachPhraseKey';
import type { CoachPhrasingSlot } from './CoachPhrasingSlot';
import { listText } from './listText';
import { pluralText } from './pluralText';
import { possessiveText } from './possessiveText';

type Evidence = readonly (readonly [label: string, value: string])[];

const groupOf = (id: string | undefined): MuscleGroup => {
  const group = MuscleGroup.values.find((g) => g === id);
  if (group === undefined) throw new StateError(`No muscle group is named ${id}.`);
  return group;
};

/** A fraction as a percentage, to at most two decimals: 0.005 is "0.5%". */
const percent = (fraction: number) => `${toStringAsFixed(fraction * 100, 2).replace(/\.?0+$/, '')}%`;

/**
 * The words of each training, water and sleep finding (MM-609), in the
 * coach's voice (MM-617): a title in numbers, then the number and the
 * verdict, then the orders (`coachAdviceText`: two sessions this week, the
 * sets that bring a group to ten, one more set on a stalled lift, the
 * slower pace, sleep, protein and the loads), and the evidence as label
 * and value pairs. Holding up is short: the number, then "Keep that."
 *
 * Water is what was logged, never hydration; the protein minimum is the
 * same every day; nothing asks for more exercise against an
 * eating-disorder history (those findings are never made).
 */
export function trainingFindingText(f: CoachFinding, fmt: Fmt): readonly [title: string, body: string, evidence: Evidence] {
  const raw = (key: string) => f.figures[key] ?? 0;
  const n = (key: string) => roundHalfAwayFromZero(raw(key)) + 0;
  const subjects = f.subjects ?? [];
  const period = ['Period', `${Fmt.shortDay(f.from)} to ${Fmt.shortDay(f.to)}`] as const;
  const water = (key: string) => waterAmount(raw(key), fmt.units);
  const used = new Map<CoachPhrasingSlot, number>();
  const say = (slot: CoachPhrasingSlot, values: Readonly<Record<string, string>> = {}) => {
    const part = used.get(slot) ?? 0;
    used.set(slot, part + 1);
    return coachPhrase(slot, coachPhraseKey(f, part), values);
  };
  const orders = coachAdviceText(f, fmt).sentences;
  const body = (...lead: readonly string[]) => [...lead, ...orders].filter((s) => s !== '').join(' ');
  const held = (lead: string) => `${lead} ${say('holdKeep')}`;
  const weeksOf = (days: number) => roundHalfAwayFromZero(days / 7) + 0;

  switch (`${f.signal}:${f.kind}`) {
    case 'trainingStopped:fix': {
      const lead = say('leadTrainingStopped', { days: `${n('daysSince')}` });
      const rows: Evidence = [period, ['Days since the last session', `${n('daysSince')}`]];
      const why =
        n('suspended') === 1
          ? say('trainingStoppedPaused')
          : n('leanGain') === 1
            ? say('trainingStoppedGain', { days: `${n('suspendAfterDays')}` })
            : say('trainingStoppedLoss');
      return [
        n('suspended') === 1 ? `No session in ${n('daysSince')} days: surplus paused` : `No session in ${n('daysSince')} days`,
        body(lead, why, say('orderPause')),
        rows,
      ];
    }
    case 'trainingStopped:holdingUp':
      return [
        `Trained in each of the last ${n('weeks')} weeks`,
        held(say('leadTrainingStoppedHeld', { weeks: `${n('weeks')}`, sessions: pluralText(n('sessions'), 'session') })),
        [period, ['Sessions', `${n('sessions')}`], ['Weeks with a session', `${n('weeks')} of ${n('weeks')}`]],
      ];
    case 'trainingDropped:fix':
    case 'trainingDropped:holdingUp': {
      const recent = pluralText(n('recentSessions'), 'session');
      const evidence: Evidence = [
        period,
        [`Sessions in the last ${n('recentDays')} days`, `${n('recentSessions')}`],
        [`Usual rate, the ${n('usualWeeks')} weeks before`, `${toStringAsFixed(raw('usualPerWeek'), 1)} a week`],
      ];
      if (f.kind === 'fix') {
        return [
          `${recent} in ${n('recentDays')} days`,
          body(say('leadTrainingDropped', { recent, days: `${n('recentDays')}`, usual: `${n('usualPerWeek')}` }), say('trainingDroppedWhy')),
          evidence,
        ];
      }
      return [
        `${recent} in ${n('recentDays')} days, as usual`,
        held(say('leadTrainingDroppedHeld', { recent, days: `${n('recentDays')}` })),
        evidence,
      ];
    }
    case 'setsPerMuscle:fix': {
      const group = muscleGroupLabel(groupOf(subjects[0]));
      const top = muscleGroupLabel(groupOf(subjects[1]));
      return [
        `${group}: about ${pluralText(n('groupSets'), 'hard set')} a week`,
        body(say('leadSets', { group, sets: pluralText(n('groupSets'), 'hard set'), top, topSets: `${n('topSets')}` }), say('setsWhy')),
        [
          period,
          [`${group}, hard sets a week`, toStringAsFixed(raw('groupSets'), 1)],
          [`${top}, hard sets a week`, toStringAsFixed(raw('topSets'), 1)],
          ['Days trained', `${n('sessions')}`],
        ],
      ];
    }
    case 'setsPerMuscle:holdingUp': {
      const groups = subjects.map((s) => muscleGroupLabel(groupOf(s)));
      return [
        `${pluralText(groups.length, 'group')} at ${n('rangeLow')}–${n('rangeHigh')} sets a week`,
        held(say('leadSetsHeld', { groups: listText(groups), low: `${n('rangeLow')}`, high: `${n('rangeHigh')}` })),
        [period, ['Groups in the range', listText(groups)]],
      ];
    }
    case 'strengthRising:holdingUp': {
      const name = subjects[0] ?? '';
      const change = raw('fromKg') > 0 ? raw('toKg') / raw('fromKg') - 1 : 0;
      const weeks = weeksOf(raw('days'));
      return [
        `${name} up ${percent(roundHalfAwayFromZero(change * 100) / 100)} in ${weeks} weeks`,
        `${say('leadStrengthRisingHeld', {
          name,
          possessive: possessiveText(name),
          from: fmt.load(raw('fromKg')),
          to: fmt.load(raw('toKg')),
          sessions: pluralText(n('sessions'), 'session'),
        })} ${say('keepPushing')}`,
        [
          period,
          ['Estimated max then', fmt.load(raw('fromKg'))],
          ['Estimated max now', fmt.load(raw('toKg'))],
          ['Sessions', `${n('sessions')}`],
        ],
      ];
    }
    case 'strengthStalled:fix': {
      const weeks = weeksOf(raw('days'));
      return [
        `${pluralText(n('lifts'), 'lift')} level for ${weeks} weeks`,
        body(say('leadStalled', { lifts: listText(subjects), weeks: `${weeks}` })),
        [
          period,
          ...subjects.map((name, i) => [name, `${fmt.load(raw(`from${i}Kg`))} to ${fmt.load(raw(`to${i}Kg`))}`] as const),
        ],
      ];
    }
    case 'strengthOnFatLoss:fix': {
      const weeks = `${n('windowDays') / 7}`;
      const lines: string[] = [say('leadStrengthFalling', { lifts: listText(subjects), weeks })];
      const evidence: (readonly [string, string])[] = [
        period,
        ...subjects.map((name, i) => [name, `${fmt.load(raw(`from${i}Kg`))} to ${fmt.load(raw(`to${i}Kg`))}`] as const),
      ];
      if (f.figures['sleepAverageMinutes'] !== undefined) {
        lines.push(say('strengthFallingSleep', { sleep: sleepDurationText(raw('sleepAverageMinutes')), nights: pluralText(n('sleepNights'), 'recorded night') }));
        evidence.push(['Average sleep', sleepDurationText(raw('sleepAverageMinutes'))]);
      }
      if (f.figures['proteinWholeDays'] !== undefined) {
        lines.push(say('strengthFallingProtein', { met: `${n('proteinMetDays')}`, days: `${n('proteinWholeDays')}` }));
        evidence.push(['Days at the protein minimum', `${n('proteinMetDays')} of ${n('proteinWholeDays')}`]);
      }
      if (f.figures['slowerPace'] === undefined) lines.push(say('orderBreak'));
      return [`${pluralText(n('lifts'), 'lift')} down over ${weeks} weeks`, body(...lines), evidence];
    }
    case 'strengthOnFatLoss:holdingUp':
      return [
        `${listText(subjects)} held over ${n('weeks')} weeks`,
        held(say('leadStrengthHeld', { lifts: listText(subjects), weeks: `${n('weeks')}` })),
        [
          period,
          ...subjects.map(
            (name, i) =>
              [name, `${fmt.load(raw(`from${i}Kg`))} to ${fmt.load(raw(`to${i}Kg`))}, ${pluralText(n(`sessions${i}`), 'session')}`] as const,
          ),
        ],
      ];
    case 'trainingDays:holdingUp': {
      const days = Array.from({ length: n('weekdays') }, (_, i) => [weekdayLabel(n(`weekday${i}`)), n(`weeksOn${i}`)] as const);
      return [
        `${listText(days.map(([day]) => day))}, most weeks`,
        held(say('leadTrainingDaysHeld', { days: listText(days.map(([day, weeks]) => `${day} in ${weeks} of ${n('weeks')} weeks`)) })),
        [period, ...days.map(([day, weeks]) => [`${day}s trained`, `${weeks} of ${n('weeks')}`] as const)],
      ];
    }
    case 'rirUnrecorded:dataQuality':
      return [
        `Reps in reserve on ${n('recordedSets')} of ${n('hardSets')} sets`,
        `${say('leadRir', { recorded: `${n('recordedSets')}`, hard: `${n('hardSets')}` })} ${say('orderRecordRir')}`,
        [period, ['Hard sets', `${n('hardSets')}`], ['With reps in reserve', `${n('recordedSets')}`]],
      ];
    case 'proteinByTrainingDay:fix': {
      const rest = n('lowerOnRestDays') === 1;
      const [lowMet, lowDays, lowName] = rest ? [n('restMet'), n('restDays'), 'rest days'] : [n('trainingMet'), n('trainingDays'), 'training days'];
      return [
        `Protein minimum: ${lowMet} of ${lowDays} ${lowName}`,
        body(
          say('leadProteinByTrainingDay', {
            trainingMet: `${n('trainingMet')}`,
            trainingDays: `${n('trainingDays')}`,
            restMet: `${n('restMet')}`,
            restDays: `${n('restDays')}`,
          }),
          say('sameEveryDay', { minimum: Fmt.grams(raw('minimumG')), days: lowName }),
        ),
        [
          period,
          ['Training days at the minimum', `${n('trainingMet')} of ${n('trainingDays')}`],
          ['Rest days at the minimum', `${n('restMet')} of ${n('restDays')}`],
          ['Protein minimum', Fmt.grams(raw('minimumG'))],
        ],
      ];
    }
    case 'waterOnTrainingDays:fix':
      return [
        `Water logged under goal on ${n('underDays')} training days`,
        body(
          say('leadWaterLogged', { logged: `${n('loggedDays')}`, days: `${n('days')}` }),
          say('leadWater', {
            under: `${n('underDays')}`,
            training: `${n('trainingDays')}`,
            trainingAverage: water('trainingAverageMl'),
            restAverage: water('restAverageMl'),
          }),
          say('waterNote'),
        ),
        [
          period,
          ['Days with water logged', `${n('loggedDays')} of ${n('days')}`],
          ['Training days under the goal', `${n('underDays')} of ${n('trainingDays')}`],
          ['Training-day average logged', water('trainingAverageMl')],
          ['Rest-day average logged', water('restAverageMl')],
          ['Goal', water('goalMl')],
        ],
      ];
    case 'waterOnTrainingDays:holdingUp':
      return [
        `Water at goal, ${n('atGoalDays')} of ${n('trainingDays')} training days`,
        held(say('leadWaterHeld', { goal: water('goalMl'), atGoal: `${n('atGoalDays')}`, training: `${n('trainingDays')}` })),
        [
          period,
          ['Days with water logged', `${n('loggedDays')} of ${n('days')}`],
          ['Training days at the goal', `${n('atGoalDays')} of ${n('trainingDays')}`],
          ['Goal', water('goalMl')],
        ],
      ];
    // The wearable's cardio and steps against their floors (MM-678).
    case 'cardioMinutes:fix':
      return [
        `${minutesText(raw('minutes'))} of cardio this week`,
        body(say('leadCardioShort', { minutes: minutesText(raw('minutes')), floor: minutesText(raw('floor')) }), say('cardioWhy')),
        [period, ['Cardio this week', minutesText(raw('minutes'))], ['Floor', `${minutesText(raw('floor'))} a week`], ['Sessions', `${n('sessions')}`]],
      ];
    case 'cardioMinutes:holdingUp':
      return [
        `Cardio over the floor for ${n('weeks')} weeks`,
        held(say('leadCardioHeld', { weeks: `${n('weeks')}`, minutes: minutesText(raw('minutes')) })),
        [
          period,
          ['Cardio this week', minutesText(raw('minutes'))],
          ['Floor', `${minutesText(raw('floor'))} a week`],
          ['Weeks over the floor', `${n('weeks')} of ${n('weeks')}`],
        ],
      ];
    case 'stepsPerDay:fix':
      return [
        `About ${Fmt.whole(raw('steps'))} steps a day`,
        body(say('leadStepsShort', { steps: Fmt.whole(raw('steps')), floor: Fmt.whole(raw('floor')) })),
        [
          period,
          ['Steps a day, average', Fmt.whole(raw('steps'))],
          ['Days with steps', `${n('days')} of 7`],
          ['Floor', `${Fmt.whole(raw('floor'))} a day`],
        ],
      ];
    case 'stepsPerDay:holdingUp':
      return [
        `Over ${Fmt.whole(raw('floor'))} steps a day for ${n('weeks')} weeks`,
        held(say('leadStepsHeld', { weeks: `${n('weeks')}`, floor: Fmt.whole(raw('floor')), steps: Fmt.whole(raw('steps')) })),
        [
          period,
          ['Steps a day, average', Fmt.whole(raw('steps'))],
          ['Floor', `${Fmt.whole(raw('floor'))} a day`],
          ['Weeks over the floor', `${n('weeks')} of ${n('weeks')}`],
        ],
      ];
    default:
      throw new StateError(`No words for the ${f.kind} finding of ${f.signal}.`);
  }
}
