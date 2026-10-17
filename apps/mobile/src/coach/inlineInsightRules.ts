import type { InlineInsightRule } from './InlineInsightRule';

/**
 * The inline catalog's rules, in priority order within each area, with the
 * words drafted in MM-365 to MM-368. Sleep's wait for a night of sleep to
 * be recorded (MM-250).
 */
export const inlineInsightRules: readonly InlineInsightRule[] = [
  {
    area: 'food',
    title: 'Large portion',
    example: 'About twice the usual serving (2 cups). Worth checking the amount is right.',
    // A prompt about how much was eaten can read as a cue to eat less (the panel's request, 2026-10-17).
    notWithEatingDisorderHistory: true,
  },
  { area: 'food', title: 'Light on protein', example: '520 kcal with 9 g of protein. Adding a protein source here makes your minimum easier.' },
  {
    area: 'food',
    title: 'Mostly fat',
    example: 'Most of this item’s calories come from fat (62%). A leaner choice or a smaller portion leaves more room for protein.',
    notWithEatingDisorderHistory: true,
  },
  {
    area: 'food',
    title: 'Salty item',
    example: 'This item is about half your sodium limit (1,150 mg of 2,300).',
    notWithEatingDisorderHistory: true,
  },
  {
    area: 'food',
    title: 'Often logged, low grade',
    example: 'Logged on 6 of the last 14 days, and graded D, mostly for its saturated fat and sugar.',
    notWithEatingDisorderHistory: true,
  },
  {
    area: 'training',
    title: 'Volume jump',
    example: '14 sets for chest this week against about 9 lately. A smaller step is easier to recover from.',
  },
  {
    area: 'training',
    title: 'Holding steady',
    example: 'About the same in your last 4 sessions. A small step up in reps or load is a common next step.',
  },
  {
    area: 'training',
    title: 'Strength on a cut',
    example: 'Held through 6 weeks of eating below maintenance. That is what a well-run cut looks like.',
    notWithEatingDisorderHistory: true,
  },
  {
    area: 'body',
    title: 'Unusual weigh-in time',
    example: 'Weighed later than usual. Weighing at the same time each day makes the trend steadier.',
    notWithEatingDisorderHistory: true,
  },
  {
    area: 'body',
    title: 'Within the noise',
    example: 'Within the usual day-to-day difference of a tape, so not a change yet.',
    notWithEatingDisorderHistory: true,
  },
  { area: 'water', title: 'Water on few days', example: 'Water logged on 5 of the last 14 days. A glass with each meal is an easy habit to log.' },
  { area: 'sleep', title: 'Short night', example: 'Under 6 hours. Hunger and training often feel harder after a short night.' },
  { area: 'sleep', title: 'Short most nights', example: 'Under 7 hours on 9 of the last 14 nights. Sleep is part of recovery and appetite.' },
];
