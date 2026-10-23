import type { MealSize } from '../domain/food/estimate/MealSize';

/**
 * What the easy-to-miss check was answered with (MM-575): nothing was
 * missed, so the day is marked complete; or something was, and add-food
 * opens on it, searched for or estimated, with the day left as it was.
 */
export type EasyToMissAnswer =
  | { readonly kind: 'nothingMissed' }
  | { readonly kind: 'add'; readonly query?: string; readonly estimateSize?: MealSize };
