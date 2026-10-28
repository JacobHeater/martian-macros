import type { CardioActivity } from '../domain/training/CardioActivity';

const labels: Readonly<Record<CardioActivity, string>> = {
  walking: 'Walking',
  running: 'Running',
  hiking: 'Hiking',
  cycling: 'Cycling',
  elliptical: 'Elliptical',
  rowing: 'Rowing',
  stairClimbing: 'Stair climbing',
  swimming: 'Swimming',
  intervals: 'Intervals',
  other: 'Other cardio',
};

/** What a cardio session's activity is called on the screen (MM-677). */
export const cardioActivityLabel = (activity: CardioActivity): string => labels[activity];
