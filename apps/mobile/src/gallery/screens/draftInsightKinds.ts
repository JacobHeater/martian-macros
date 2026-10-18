import type { ItemInsightKind } from '../../engine/ItemInsightKind';
import { itemInsightKinds } from '../../engine/itemInsightKinds';

/**
 * Every kind of inline insight, as the design draws Settings > Coach
 * (MM-364): the kinds the app has, and the drafts of MM-365, MM-367 and
 * MM-368 that the panel's domain roles have yet to check. Design only: the
 * app lists only `itemInsightKinds`.
 */
export const draftInsightKinds: readonly ItemInsightKind[] = [
  {
    id: 'largePortion',
    area: 'food',
    title: 'Large portion',
    example: 'About twice the usual serving (2 cups). Worth checking the amount is right.',
    priority: 'dataQuality',
    // A prompt about how much was eaten can read as a cue to eat less (the panel's request, 2026-10-17).
    notWithEatingDisorderHistory: true,
  },
  {
    id: 'lightOnProtein',
    area: 'food',
    title: 'Light on protein',
    example: '520 kcal with 9 g of protein. Adding a protein source here makes your minimum easier.',
    priority: 'pattern',
  },
  {
    id: 'mostlyFat',
    area: 'food',
    title: 'Mostly fat',
    example: 'Most of this item’s calories come from fat (62%). A leaner choice or a smaller portion leaves more room for protein.',
    priority: 'pattern',
    notWithEatingDisorderHistory: true,
  },
  {
    id: 'saltyItem',
    area: 'food',
    title: 'Salty item',
    example: 'This item is about half your sodium limit (1,150 mg of 2,300).',
    priority: 'pattern',
    notWithEatingDisorderHistory: true,
  },
  {
    id: 'oftenLoggedLowGrade',
    area: 'food',
    title: 'Often logged, low grade',
    example: 'Logged on 6 of the last 14 days, and graded D, mostly for its saturated fat and sugar.',
    priority: 'education',
    notWithEatingDisorderHistory: true,
  },
  ...itemInsightKinds.filter((kind) => kind.area === 'training'),
  {
    id: 'unusualWeighInTime',
    area: 'body',
    title: 'Unusual weigh-in time',
    example: 'Weighed later than usual. Weighing at the same time each day makes the trend steadier.',
    priority: 'dataQuality',
    aboutWeight: true,
  },
  {
    id: 'withinTheNoise',
    area: 'body',
    title: 'Within the noise',
    example: 'Within the usual day-to-day difference of a tape, so not a change yet.',
    priority: 'pattern',
    notWithEatingDisorderHistory: true,
  },
  {
    id: 'waterOnFewDays',
    area: 'water',
    title: 'Water on few days',
    example: 'Water logged on 5 of the last 14 days. A glass with each meal is an easy habit to log.',
    priority: 'dataQuality',
  },
  {
    id: 'shortNight',
    area: 'sleep',
    title: 'Short night',
    example: 'Under 6 hours. Hunger and training often feel harder after a short night.',
    priority: 'pattern',
  },
  {
    id: 'shortMostNights',
    area: 'sleep',
    title: 'Short most nights',
    example: 'Under 7 hours on 9 of the last 14 nights. Sleep is part of recovery and appetite.',
    priority: 'pattern',
  },
];
