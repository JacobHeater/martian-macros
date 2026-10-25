import type { CoachCause } from '../../engine/analysis/CoachCause';
import { coachMealWords } from './coachMealWords';
import { foodInSentence } from './foodInSentence';

/**
 * What did it, in a few words, for the headline (MM-617): "the buffet"
 * for a logged meal named a buffet, "the sausage egg and cheese biscuit"
 * for another logged meal, the meal ("lunch") when it was separate foods,
 * or the food ("peanut butter") on a span. Undefined when nothing can be
 * named.
 */
export function coachCauseWords(cause: CoachCause | undefined): string | undefined {
  if (cause === undefined) return undefined;
  if (cause.mealName !== undefined) return /\bbuffet\b/i.test(cause.mealName) ? 'the buffet' : `the ${foodInSentence(cause.mealName)}`;
  if (cause.meal !== undefined) return coachMealWords(cause.meal);
  return cause.food === undefined ? undefined : foodInSentence(cause.food.name);
}
