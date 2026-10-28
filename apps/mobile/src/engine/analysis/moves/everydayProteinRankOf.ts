import type { FoodGroup } from '../../../domain/food/FoodGroup';
import { everydayProteins } from './everydayProteins';

/**
 * Words that take a food off the everyday list however it is named
 * (MM-688): breaded, fried and sauced forms, dishes made of it, raw,
 * dried and powdered forms. "Cooked, dry heat" and "from raw" are how the
 * USDA says cooked, and stay.
 */
const notEveryday =
  /\b(breaded|battered|fried|coated|tenders?|nuggets?|fingers?|patt(?:y|ies)|sausage|jerky|salad|sandwich|wrap|burrito|taco|soup|casserole|pot pie|dumplings?|skin eaten|coating eaten|with skin|raw|uncooked|dried|dry|powder|mix|in oil|smoked|pickled|pate|spread|dip|nachos|pizza|baby)\b/i;

/**
 * Where a catalog food stands on the everyday list (MM-688): the index of
 * the everyday protein it is, 0 first, or undefined when it is none of
 * them, or a breaded, fried, sauced, raw or dried form of one.
 */
export function everydayProteinRankOf(food: { readonly name: string; readonly group: FoodGroup }): number | undefined {
  const plain = food.name.replace(/\bfrom raw\b/gi, '').replace(/\bdry heat\b/gi, '');
  if (notEveryday.test(plain)) return undefined;
  const rank = everydayProteins.findIndex((protein) => protein.group === food.group && protein.name.test(food.name));
  return rank === -1 ? undefined : rank;
}
