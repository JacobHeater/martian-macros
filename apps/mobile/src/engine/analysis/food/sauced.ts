import { foodTagsOf } from '../language/foodTagsOf';

/**
 * Whether a food's name says it came in or with a sauce (MM-617, MM-622):
 * the food-language tagger's `sauced`. "Sauce on the side" and "No sauce"
 * are said only for such foods. Fried or breaded food without a sauce is not
 * sauced: its order is a swap (`swapFor`'s better preparation) or half.
 */
export function sauced(name: string): boolean {
  return foodTagsOf(name).has('sauced');
}
