import type { FoodGroup } from '../domain/food/FoodGroup';
import { categoryKey } from './categoryKey';
import { foodGroupByCategory } from './foodGroupByCategory';
import { foodGroupRefinements } from './foodGroupRefinements';

/**
 * The food group of a food the source puts in `category` (MM-616), by the
 * reviewed table and, where one category holds two groups, by `name`.
 * Undefined when the source gives no category, the category is reviewed as
 * having no group, or it is not in the table.
 */
export function foodGroupOf(category: string | undefined, name: string): FoodGroup | undefined {
  if (category === undefined) return undefined;
  const key = categoryKey(category);
  const refined = foodGroupRefinements.find((r) => categoryKey(r.category) === key && r.name.test(name.trim()));
  if (refined !== undefined) return refined.group;
  return foodGroupByCategory.get(key) ?? undefined;
}
