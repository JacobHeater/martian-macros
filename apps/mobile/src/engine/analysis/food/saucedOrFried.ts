import type { FoodTag } from '../language/FoodTag';
import { foodTagsOf } from '../language/foodTagsOf';
import { breadedOrFried } from '../swap/breadedOrFried';

const tags: readonly FoodTag[] = ['sauced', 'fried', 'breaded'];

/**
 * Whether a food's name says it was sauced, fried or breaded (MM-617): by
 * the food-language tagger, or by the swap table's breaded and fried rows.
 * "Sauce on the side" and "No sauce" are said only for such foods.
 */
export function saucedOrFried(name: string): boolean {
  const found = foodTagsOf(name);
  return tags.some((tag) => found.has(tag)) || breadedOrFried(name);
}
