import { MuscleGroup } from '../domain/training/MuscleGroup';
import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { StateError } from '../lang/StateError';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { Fmt } from './Fmt';
import { muscleGroupLabel } from './muscleGroupLabel';
import { sleepDurationText } from './sleepDurationText';
import { waterAmount } from './waterAmount';
import { weekdayLabel } from './weekdayLabel';

type Evidence = readonly (readonly [label: string, value: string])[];

/** "A", "A and B", "A, B and C". */
const listed = (names: readonly string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const groupOf = (id: string | undefined): MuscleGroup => {
  const group = MuscleGroup.values.find((g) => g === id);
  if (group === undefined) throw new StateError(`No muscle group is named ${id}.`);
  return group;
};

/** A fraction as a percentage, to at most two decimals: 0.005 is "0.5%". */
const percent = (fraction: number) => `${toStringAsFixed(fraction * 100, 2).replace(/\.?0+$/, '')}%`;

/**
 * The fixed words of each training, water and sleep finding (MM-609),
 * filled from its figures: a title in numbers, what was observed with what
 * to do, and the evidence as label and value pairs, as `insightText` gives
 * them. Nothing is generated. Signals side by side are stated beside each
 * other, never as a cause; water is what was logged, never hydration; the
 * protein minimum is the same every day; nothing asks for more exercise
 * against an eating-disorder history (those findings are never made).
 */
export function trainingFindingText(f: CoachFinding, fmt: Fmt): readonly [title: string, body: string, evidence: Evidence] {
  const raw = (key: string) => f.figures[key] ?? 0;
  const n = (key: string) => roundHalfAwayFromZero(raw(key)) + 0;
  const subjects = f.subjects ?? [];
  const period = ['Period', `${Fmt.shortDay(f.from)} to ${Fmt.shortDay(f.to)}`] as const;
  const water = (key: string) => waterAmount(raw(key), fmt.units);

  switch (`${f.signal}:${f.kind}`) {
    case 'trainingStopped:fix': {
      const since = `No session has been logged for ${n('daysSince')} days.`;
      const step = 'Log one on Train, or set a pause if this is a planned break.';
      if (n('suspended') === 1) {
        return [
          `No session in ${n('daysSince')} days: surplus paused`,
          `${since} A surplus without training is stored as fat, so targets sit at maintenance until a workout is logged. ${step}`,
          [period, ['Days since the last session', `${n('daysSince')}`]],
        ];
      }
      return [
        `No session in ${n('daysSince')} days`,
        n('leanGain') === 1
          ? `${since} Training is what the gain is for: the surplus pauses at ${n('suspendAfterDays')} days without a session. ${step}`
          : `${since} Lifting is what tells your body to keep muscle while you lose weight. ${step}`,
        [period, ['Days since the last session', `${n('daysSince')}`]],
      ];
    }
    case 'trainingStopped:holdingUp':
      return [
        `Trained in each of the last ${n('weeks')} weeks`,
        `${plural(n('sessions'), 'session', 'sessions')} over the last ${n('weeks')} weeks, with at least one every week.`,
        [period, ['Sessions', `${n('sessions')}`], ['Weeks with a session', `${n('weeks')} of ${n('weeks')}`]],
      ];
    case 'trainingDropped:fix':
    case 'trainingDropped:holdingUp': {
      const recent = plural(n('recentSessions'), 'session', 'sessions');
      const usual = `about ${n('usualPerWeek')} a week`;
      const evidence: Evidence = [
        period,
        [`Sessions in the last ${n('recentDays')} days`, `${n('recentSessions')}`],
        [`Usual rate, the ${n('usualWeeks')} weeks before`, `${toStringAsFixed(raw('usualPerWeek'), 1)} a week`],
      ];
      if (f.kind === 'fix') {
        return [
          `${recent} in ${n('recentDays')} days`,
          `${recent} in ${n('recentDays')} days, against ${usual} over the ${n('usualWeeks')} weeks before. ` +
            'One session a week with heavy sets holds strength for most younger adults; older adults may need two.',
          evidence,
        ];
      }
      return [
        `${recent} in ${n('recentDays')} days, as usual`,
        `${recent} in the last ${n('recentDays')} days, in line with ${usual} over the ${n('usualWeeks')} weeks before.`,
        evidence,
      ];
    }
    case 'setsPerMuscle:fix': {
      const group = muscleGroupLabel(groupOf(subjects[0]));
      const top = muscleGroupLabel(groupOf(subjects[1]));
      const sets = (key: string) => plural(n(key), 'hard set', 'hard sets');
      return [
        `${group}: about ${sets('groupSets')} a week`,
        `Over the last ${n('weeks')} weeks, ${group.toLowerCase()} averaged about ${sets('groupSets')} a week, while ` +
          `${top.toLowerCase()} averaged about ${n('topSets')}. Ten to twenty a week is the typical range; an exercise for ` +
          `${group.toLowerCase()} on one or two training days would add sets there. Weekly volume on Train shows every group.`,
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
        `${plural(groups.length, 'group', 'groups')} at ${n('rangeLow')}–${n('rangeHigh')} sets a week`,
        `${listed(groups)} had ${n('rangeLow')} to ${n('rangeHigh')} hard sets a week in at least 3 of the last ${n('weeks')} weeks, the typical range.`,
        [period, ['Groups in the range', listed(groups)]],
      ];
    }
    case 'strengthRising:holdingUp': {
      const name = subjects[0] ?? '';
      const change = raw('fromKg') > 0 ? raw('toKg') / raw('fromKg') - 1 : 0;
      const weeks = roundHalfAwayFromZero(raw('days') / 7) + 0;
      return [
        `${name} up ${percent(roundHalfAwayFromZero(change * 100) / 100)} in ${weeks} weeks`,
        `${name}'s estimated max went from ${fmt.load(raw('fromKg'))} to ${fmt.load(raw('toKg'))} over ` +
          `${plural(n('sessions'), 'session', 'sessions')}, on its smoothed trend.`,
        [
          period,
          ['Estimated max then', fmt.load(raw('fromKg'))],
          ['Estimated max now', fmt.load(raw('toKg'))],
          ['Sessions', `${n('sessions')}`],
        ],
      ];
    }
    case 'strengthStalled:fix': {
      const weeks = roundHalfAwayFromZero(raw('days') / 7) + 0;
      return [
        `${plural(n('lifts'), 'lift', 'lifts')} level for ${weeks} weeks`,
        `${listed(subjects)} have each stayed within ${percent(raw('tolerance'))} of where they were ${weeks} weeks ago, ` +
          'and their last three sessions at one load brought no more reps. One more rep or one more set at that load is the usual next step.',
        [
          period,
          ...subjects.map((name, i) => [name, `${fmt.load(raw(`from${i}Kg`))} to ${fmt.load(raw(`to${i}Kg`))}`] as const),
        ],
      ];
    }
    case 'strengthOnFatLoss:fix': {
      const lines: string[] = [
        `${listed(subjects)} ${subjects.length === 1 ? 'is' : 'are'} down 5% or more on the estimated max over the last ${n('windowDays') / 7} weeks.`,
      ];
      const evidence: (readonly [string, string])[] = [
        period,
        ...subjects.map((name, i) => [name, `${fmt.load(raw(`from${i}Kg`))} to ${fmt.load(raw(`to${i}Kg`))}`] as const),
      ];
      if (f.figures['sleepAverageMinutes'] !== undefined) {
        lines.push(
          `Over the last 14 days, sleep averaged ${sleepDurationText(raw('sleepAverageMinutes'))} across ` +
            `${plural(n('sleepNights'), 'recorded night', 'recorded nights')}.`,
        );
        evidence.push(['Average sleep', sleepDurationText(raw('sleepAverageMinutes'))]);
      }
      if (f.figures['proteinWholeDays'] !== undefined) {
        lines.push(`The protein minimum was met on ${n('proteinMetDays')} of ${n('proteinWholeDays')} fully logged days.`);
        evidence.push(['Days at the protein minimum', `${n('proteinMetDays')} of ${n('proteinWholeDays')}`]);
      }
      lines.push(
        f.figures['slowerPace'] !== undefined
          ? `A gentler pace, ${percent(raw('slowerPace'))} of body weight a week, eases the deficit.`
          : 'A maintenance break eases the deficit.',
      );
      return [`${plural(n('lifts'), 'lift', 'lifts')} down over ${n('windowDays') / 7} weeks`, lines.join(' '), evidence];
    }
    case 'strengthOnFatLoss:holdingUp':
      return [
        `${listed(subjects)} held over ${n('weeks')} weeks`,
        `On fat-loss targets for ${n('weeks')} weeks, ${listed(subjects)} held: ` +
          `${subjects.length === 1 ? 'its estimated max is' : 'each estimated max is'} within about one rep of the start, or above it. ` +
          'Strength generally holds in a deficit while training carries on.',
        [
          period,
          ...subjects.map(
            (name, i) =>
              [name, `${fmt.load(raw(`from${i}Kg`))} to ${fmt.load(raw(`to${i}Kg`))}, ${plural(n(`sessions${i}`), 'session', 'sessions')}`] as const,
          ),
        ],
      ];
    case 'trainingDays:holdingUp': {
      const days = Array.from({ length: n('weekdays') }, (_, i) => [weekdayLabel(n(`weekday${i}`)), n(`weeksOn${i}`)] as const);
      return [
        `${listed(days.map(([day]) => day))}, most weeks`,
        `Over the last ${n('weeks')} weeks you trained on ` +
          `${listed(days.map(([day, weeks]) => `${day} in ${weeks}`))} of them.`,
        [period, ...days.map(([day, weeks]) => [`${day}s trained`, `${weeks} of ${n('weeks')}`] as const)],
      ];
    }
    case 'rirUnrecorded:dataQuality':
      return [
        `Reps in reserve on ${n('recordedSets')} of ${n('hardSets')} sets`,
        `Over the last ${n('days')} days, reps in reserve was recorded on ${n('recordedSets')} of ${n('hardSets')} hard sets. ` +
          'A set without it counts as hard, so weekly sets may read high. Recording it on each set makes the count closer.',
        [period, ['Hard sets', `${n('hardSets')}`], ['With reps in reserve', `${n('recordedSets')}`]],
      ];
    case 'proteinByTrainingDay:fix': {
      const rest = n('lowerOnRestDays') === 1;
      const [lowMet, lowDays, lowName] = rest ? [n('restMet'), n('restDays'), 'rest days'] : [n('trainingMet'), n('trainingDays'), 'training days'];
      return [
        `Protein minimum: ${lowMet} of ${lowDays} ${lowName}`,
        `Over the last 14 fully logged days, the protein minimum was met on ${n('trainingMet')} of ${n('trainingDays')} ` +
          `training days and ${n('restMet')} of ${n('restDays')} rest days. The minimum, ${Fmt.grams(raw('minimumG'))}, ` +
          `is the same every day, ${lowName} included.`,
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
        `Water was logged on ${n('loggedDays')} of the last ${n('days')} days. On ${n('underDays')} of ${n('trainingDays')} ` +
          `training days, the water logged was ${waterAmount(500, fmt.units)} or more under your goal of ${water('goalMl')}, ` +
          `and under the rest-day average of about ${water('restAverageMl')}. What is logged is not all that is drunk; ` +
          'a glass logged before and after a session is one easy step.',
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
        `Water was logged on ${n('loggedDays')} of the last ${n('days')} days, and on ${n('atGoalDays')} of ` +
          `${n('trainingDays')} training days the water logged reached your goal of ${water('goalMl')}.`,
        [
          period,
          ['Days with water logged', `${n('loggedDays')} of ${n('days')}`],
          ['Training days at the goal', `${n('atGoalDays')} of ${n('trainingDays')}`],
          ['Goal', water('goalMl')],
        ],
      ];
    default:
      throw new StateError(`No words for the ${f.kind} finding of ${f.signal}.`);
  }
}
