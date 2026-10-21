import type { HealthWriteKind } from './HealthWriteKind';

/**
 * What every id the app writes of each kind starts with, before the write
 * namespace (MM-522): the app's own mark on its records, the same under
 * every namespace. Turning writing off may remove everything of a kind the
 * app wrote (MM-514), found by this prefix among the app's own records and
 * never among another app's.
 */
export const healthWritePrefix: Readonly<Record<HealthWriteKind, string>> = {
  food: 'martian-macros-food-',
  water: 'martian-macros-water-',
  weight: 'martian-macros-weight-',
  workouts: 'martian-macros-workout-',
};
