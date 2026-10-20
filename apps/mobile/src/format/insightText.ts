import { Meal } from '../domain';
import type { Insight } from '../engine';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { StateError } from '../lang/StateError';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { Fmt } from './Fmt';
import { mealLabel } from './mealLabel';
import { stallText } from './stallText';
import { weekdayLabel } from './weekdayLabel';

type Evidence = readonly (readonly [label: string, value: string])[];

/**
 * The fixed words of each insight rule (MM-141), filled from the insight's
 * own figures: a title, what was observed, and the evidence as label and
 * value pairs. Nothing is generated; nothing praises eating less, calls
 * food or the user a moral name, compares with other people or predicts a
 * date.
 */
export function insightText(i: Insight, fmt: Fmt): readonly [title: string, body: string, evidence: Evidence] {
  const n = (key: string) => roundHalfAwayFromZero(i.figures[key] ?? 0) + 0;
  const period = ['Period', `Last ${i.basisDays} days`] as const;
  switch (i.rule) {
    case 'partialDays':
      return [
        'Many days are partly logged',
        `Of the last ${n('loggedDays')} days you logged, ${n('partialDays')} ` +
          'were partial. Partial days are left out of the estimate, so the ' +
          'coach is working from fewer days than it looks.',
        [period, ['Days logged', `${n('loggedDays')}`], ['Partial days', `${n('partialDays')}`]],
      ];
    case 'estimatesRising': {
      const share = roundHalfAwayFromZero((i.figures['estimatedShare'] ?? 0) * 100) + 0;
      return [
        'Most of your calories are estimates',
        `About ${share}% of your calories over the last two weeks came from ` +
          'estimated meals. Estimates are fine now and then; the coach ' +
          'learns faster from days that are mostly measured.',
        [period, ['Fully logged days', `${n('wholeDays')}`], ['Calories from estimates', `${share}%`]],
      ];
    }
    case 'weighInTiming':
      return [
        'Weigh-ins have been sparse',
        `You weighed in ${n('weighIns')} ${n('weighIns') === 1 ? 'time' : 'times'} ` +
          'in the last two weeks. With four or more a week the coach can ' +
          'tell a real change from water sooner.',
        [period, ['Weigh-ins', `${n('weighIns')}`]],
      ];
    case 'proteinShort':
      return [
        'Protein has been under your minimum',
        `You met your protein minimum on ${n('metDays')} of ${n('wholeDays')} ` +
          'fully logged days. On the other days you were about ' +
          `${n('averageShortfallG')} g short on average.`,
        [
          period,
          ['Fully logged days', `${n('wholeDays')}`],
          ['Days at or above the minimum', `${n('metDays')}`],
          ['Average shortfall', `${n('averageShortfallG')} g`],
        ],
      ];
    case 'sodiumOverLimit':
      return [
        'Sodium over the limit you set',
        `Sodium was over your limit of ${Fmt.whole(i.figures['limitMg'] ?? 0)} mg on ${n('overDays')} of ` +
          `${n('judgedDays')} days with enough sodium data. In many diets, most sodium comes from ` +
          'packaged and restaurant food.',
        [
          period,
          ['Days over the limit', `${n('overDays')}`],
          ['Days with enough sodium data', `${n('judgedDays')}`],
          ['Days left out (too little sodium data)', `${n('leftOutDays')}`],
          ['Your limit', `${Fmt.whole(i.figures['limitMg'] ?? 0)} mg`],
        ],
      ];
    case 'proteinByMeal': {
      const which = Meal.values[n('meal')];
      if (which === undefined) throw new StateError(`No meal is numbered ${n('meal')}.`);
      const meal = mealLabel(which).toLowerCase();
      return [
        'Where the protein goes missing',
        `On days you miss protein, ${meal} has almost none. Adding some ` +
          'there is usually the easiest way to reach it. Spreading ' +
          'protein over the day may help slightly; your daily total ' +
          'matters much more.',
        [
          period,
          ['Days under the minimum', `${n('missedDays')}`],
          [`Of those, with almost none at ${meal}`, `${n('lowDays')}`],
        ],
      ];
    }
    case 'weekendHigher': {
      const weekend = n('weekendAverageKcal');
      const weekday = n('weekdayAverageKcal');
      return [
        'Weekends run higher than weekdays',
        `Over the last two weeks your weekend days averaged about ${Fmt.whole(weekend)} kcal ` +
          `and your weekdays about ${Fmt.whole(weekday)}, against a target of ${Fmt.whole(n('targetKcal'))}. ` +
          'A plan that expects the weekend is easier to follow than one that does not; the week as a whole is what counts.',
        [
          period,
          ['Weekend days (fully logged)', `${n('weekendDays')}`],
          ['Weekday days (fully logged)', `${n('weekdayDays')}`],
          ['Weekend average', `${Fmt.whole(weekend)} kcal`],
          ['Weekday average', `${Fmt.whole(weekday)} kcal`],
          ['Target', `${Fmt.whole(n('targetKcal'))} kcal`],
        ],
      ];
    }
    case 'waistAgainstWeight': {
      const from = i.figures['waistFromCm'] ?? 0;
      const to = i.figures['waistToCm'] ?? 0;
      const delta = to - from;
      const down = `${delta < 0 ? '−' : '+'}${toStringAsFixed(fmt.lengthFromCm(Math.abs(delta)), 1)} ${fmt.lengthUnit}`;
      return [
        'Your waist is down while the scale held',
        `Over the last two weeks your waist went from ${fmt.length(from)} to ${fmt.length(to)} ` +
          `while your trend weight moved ${fmt.weightDelta(i.figures['weightChangeKg'] ?? 0)}. ` +
          'A smaller waist at a steady weight is fat going and muscle or water staying; the tape sees what the scale cannot.',
        [
          period,
          ['Waist then', fmt.length(from)],
          ['Waist now', fmt.length(to)],
          ['Waist change', down],
          ['Trend weight change', fmt.weightDelta(i.figures['weightChangeKg'] ?? 0)],
        ],
      ];
    }
    case 'consistentDay': {
      const day = weekdayLabel(n('weekday'));
      const unlogged = n('unlogged') === 1;
      return [
        unlogged ? `${day} goes unlogged` : `${day} is your highest day`,
        unlogged
          ? `${day} was the day without a log in both of the last two weeks. A day the coach cannot see is left out of the estimate; ` +
            'if it is a day that is hard to log, a rough estimate of the whole day still counts.'
          : `${day} was your highest day in both of the last two weeks, about ${Fmt.whole(n('averageKcal'))} kcal. ` +
            'Nothing to change; it is worth knowing which day the week leans on.',
        [
          period,
          ['Weeks', `${n('weeks')}`],
          ...(unlogged ? [] : [[`${day} average`, `${Fmt.whole(n('averageKcal'))} kcal`] as const]),
        ],
      ];
    }
    case 'stall': {
      const stall = i.stall;
      if (stall === undefined) throw new StateError('A stall insight carries its assessment.');
      const [body, options] = stallText(stall, fmt);
      const evidence: (readonly [string, string])[] = [
        period,
        ['Fully logged days', `${stall.usableFoodDays}`],
        ['Weigh-ins', `${stall.weighIns}`],
      ];
      if (stall.slopeKgPerWeek !== undefined) evidence.push(['Trend', `${fmt.weightDelta(stall.slopeKgPerWeek)} a week`]);
      if (stall.intendedKgPerWeek !== undefined) {
        evidence.push(['Intended', `${fmt.weightDelta(stall.intendedKgPerWeek)} a week`]);
      }
      return ['Progress has slowed', options.length === 0 ? body : `${body} Options: ${options.join('; ')}.`, evidence];
    }
  }
}
