import type { WeightDisplay } from '../domain/WeightDisplay';

/**
 * The weight display in force (MM-118): the one the person chose, or else
 * Trend only with an eating-disorder history and Everything otherwise.
 */
export function weightDisplayOf(chosen: WeightDisplay | undefined, { eatingDisorderHistory }: { eatingDisorderHistory: boolean }): WeightDisplay {
  return chosen ?? (eatingDisorderHistory ? 'trendOnly' : 'everything');
}
