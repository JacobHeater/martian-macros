import type { ItemInsightKind } from '../../engine/ItemInsightKind';
import { itemInsightKinds } from '../../engine/itemInsightKinds';

/**
 * Every kind of inline insight, as the design draws Settings > Coach
 * (MM-364): the kinds the app has, and the drafts of MM-368 that wait for a
 * night of sleep to be recorded (MM-250). Design only: the app lists only
 * `itemInsightKinds`.
 */
export const draftInsightKinds: readonly ItemInsightKind[] = [
  ...itemInsightKinds,
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
